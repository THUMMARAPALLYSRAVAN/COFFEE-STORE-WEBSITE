"use strict";

const API_URL = "/api/drinks";
const ORDER_API_URL = "/api/orders";
const CAFE_ADDRESS = "Near Ashoka Hotel, Hanamkonda";

let drinks = [];
let cart = [];

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[ch]);
}

function money(value) {
    return "₹" + Number(value || 0).toFixed(2);
}

function available(drink) {
    return drink.isAvailable === true || drink.isAvailable === "true" || drink.isAvailable === 1;
}

async function loadDrinks() {
    const menu = document.getElementById("drink-list");
    const adminList = document.getElementById("admin-drink-list");
    try {
        if (menu) menu.textContent = "Preparing your coffee menu...";
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`Drinks API returned ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("The drinks API did not return a list.");
        drinks = data;
        renderDrinks();
        renderAdminDrinks();
    } catch (error) {
        console.error("loadDrinks:", error);
        if (menu) menu.textContent = "Unable to load menu. Check that the API is running.";
        if (adminList) adminList.textContent = error.message;
    }
}

function renderDrinks() {
    const container = document.getElementById("drink-list");
    if (!container) return;
    const availableDrinks = drinks.filter(available);
    if (!availableDrinks.length) {
        container.innerHTML = "<p>No drinks currently available.</p>";
        return;
    }
    container.innerHTML = availableDrinks.map(drink => `
        <article class="drink-card">
            <h3>${escapeHTML(drink.drinkName)}</h3>
            <p>${escapeHTML(drink.description || "")}</p>
            <h4>${money(drink.price)}</h4>
            <button type="button" onclick="addToCart(${Number(drink.drinkId)})">Add to Cart</button>
        </article>
    `).join("");
}

function addToCart(drinkId) {
    const drink = drinks.find(d => Number(d.drinkId) === Number(drinkId));
    if (!drink || !available(drink)) {
        alert("This drink is currently unavailable.");
        return;
    }
    const existing = cart.find(item => Number(item.drinkId) === Number(drinkId));
    if (existing) existing.quantity += 1;
    else cart.push({ drinkId: drink.drinkId, drinkName: drink.drinkName, price: Number(drink.price), quantity: 1 });
    renderCart();
}

function updateQuantity(drinkId, delta) {
    const item = cart.find(i => Number(i.drinkId) === Number(drinkId));
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) cart = cart.filter(i => Number(i.drinkId) !== Number(drinkId));
    renderCart();
}

function removeFromCart(drinkId) {
    cart = cart.filter(i => Number(i.drinkId) !== Number(drinkId));
    renderCart();
}

function calculateTotal() {
    return cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
}

function renderCart() {
    const container = document.getElementById("cart-items");
    const total = document.getElementById("cart-total");
    if (!container) return;

    if (!cart.length) {
        container.innerHTML = "<p>Your cart is empty.</p>";
    } else {
        container.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div><h4>${escapeHTML(item.drinkName)}</h4><p>${money(item.price)} each</p></div>
                <div class="quantity-controls">
                    <button type="button" onclick="updateQuantity(${Number(item.drinkId)},-1)">−</button>
                    <strong>${item.quantity}</strong>
                    <button type="button" onclick="updateQuantity(${Number(item.drinkId)},1)">+</button>
                    <button type="button" onclick="removeFromCart(${Number(item.drinkId)})">Remove</button>
                </div>
                <strong>${money(item.price * item.quantity)}</strong>
            </div>
        `).join("");
    }
    if (total) total.textContent = money(calculateTotal());
}

async function calculatePayment() {
    const paymentInput = document.getElementById("payment");
    const message = document.getElementById("payment-message");
    const payButton = document.getElementById("pay-btn");
    const nameInput = document.getElementById("customer-name");
    const phoneInput = document.getElementById("customer-phone");

    if (!paymentInput || !message) return;
    if (!cart.length) {
        message.textContent = "Please add drinks to your cart.";
        return;
    }

    const customerName = nameInput?.value.trim() || "";
    const phoneNumber = phoneInput?.value.trim() || "";
    const amountPaid = Number(paymentInput.value);
    const total = calculateTotal();

    if (!customerName) {
        message.textContent = "Please enter the customer name.";
        nameInput?.focus();
        return;
    }
    if (!Number.isFinite(amountPaid) || amountPaid <= 0) {
        message.textContent = "Please enter a valid payment amount.";
        paymentInput.focus();
        return;
    }
    if (amountPaid < total) {
        message.textContent = `Insufficient payment. Please add ${money(total - amountPaid)}.`;
        return;
    }

    try {
        message.textContent = "Saving your order...";
        if (payButton) {
            payButton.disabled = true;
            payButton.textContent = "Processing...";
        }

        const payload = {
            customerName,
            phoneNumber: phoneNumber || null,
            amountPaid,
            items: cart.map(item => ({ drinkId: Number(item.drinkId), quantity: item.quantity }))
        };

        const response = await fetch(ORDER_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const raw = await response.text();
        let result = {};
        try { result = raw ? JSON.parse(raw) : {}; }
        catch { throw new Error("The server returned an unreadable response: " + raw); }

        console.log("Order API:", response.status, result);

        if (!response.ok) {
            const validation = result.errors
                ? Object.entries(result.errors).map(([key, values]) => `${key}: ${values.join(", ")}`).join(" | ")
                : "";
            throw new Error(validation || result.message || result.title || `Order failed (${response.status}).`);
        }

        if (!result.orderId || !Array.isArray(result.items)) {
            throw new Error("The order was submitted, but the server response did not contain the expected receipt details. Check the order history before trying again.");
        }

        generateBill(result);
        cart = [];
        paymentInput.value = "";
        renderCart();
        message.textContent = "Payment successful. Your order has been saved.";
        document.getElementById("bill-section")?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
        console.error("Payment error:", error);
        message.textContent = error.message || "Payment failed. Please try again.";
    } finally {
        if (payButton) {
            payButton.disabled = false;
            payButton.textContent = "Pay Now";
        }
    }
}

function generateBill(order) {
    setText("bill-number", order.orderNumber || `#${order.orderId}`);
    setText("bill-date", order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN") : new Date().toLocaleString("en-IN"));
    setText("bill-customer-name", order.customerName || "");
    setText("bill-customer-phone", order.phoneNumber || "Not provided");

    const itemsContainer = document.getElementById("bill-items");
    if (itemsContainer) {
        itemsContainer.innerHTML = (order.items || []).map(item => `
            <tr>
                <td>${escapeHTML(item.drinkName)}</td>
                <td>${Number(item.quantity)}</td>
                <td>${money(item.unitPrice)}</td>
                <td>${money(item.lineTotal)}</td>
            </tr>
        `).join("");
    }

    setText("bill-subtotal", money(order.totalAmount));
    setText("bill-paid", money(order.amountPaid));
    setText("bill-change", money(order.changeAmount));
    setText("bill-total", money(order.totalAmount));

    const receipt = document.getElementById("bill-section");
    if (receipt) receipt.hidden = false;
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value ?? "";
}

function printBill() {
    window.print();
}

// ADMIN MENU MANAGEMENT
function renderAdminDrinks() {
    const container = document.getElementById("admin-drink-list");
    if (!container) return;
    if (!drinks.length) {
        container.innerHTML = "<p>No drinks found.</p>";
        return;
    }
    container.innerHTML = drinks.map(drink => `
        <article class="admin-drink-card">
            <h3>${escapeHTML(drink.drinkName)}</h3>
            <p>${escapeHTML(drink.description || "No description")}</p>
            <p><strong>${money(drink.price)}</strong> · ${available(drink) ? "Available" : "Unavailable"}</p>
            <button type="button" onclick="editDrink(${Number(drink.drinkId)})">Edit</button>
            <button type="button" onclick="deleteDrink(${Number(drink.drinkId)})">Delete</button>
        </article>
    `).join("");
}

function clearDrinkForm() {
    const form = document.getElementById("drink-form");
    if (form) form.reset();
    const id = document.getElementById("drink-id");
    if (id) id.value = "";
    const save = document.getElementById("save-btn");
    if (save) save.textContent = "Save Drink";
}

function editDrink(id) {
    const drink = drinks.find(d => Number(d.drinkId) === Number(id));
    if (!drink) return;
    document.getElementById("drink-id").value = drink.drinkId;
    document.getElementById("drink-name").value = drink.drinkName;
    document.getElementById("drink-price").value = drink.price;
    document.getElementById("drink-description").value = drink.description || "";
    document.getElementById("drink-available").checked = available(drink);
    const save = document.getElementById("save-btn");
    if (save) save.textContent = "Update Drink";
    document.getElementById("drink-name").focus();
}

async function saveDrink(event) {
    event.preventDefault();
    const id = document.getElementById("drink-id").value;
    const payload = {
        drinkId: id ? Number(id) : 0,
        drinkName: document.getElementById("drink-name").value.trim(),
        price: Number(document.getElementById("drink-price").value),
        description: document.getElementById("drink-description").value.trim(),
        isAvailable: document.getElementById("drink-available").checked
    };

    if (!payload.drinkName || !Number.isFinite(payload.price) || payload.price <= 0) {
        alert("Enter a drink name and a valid price.");
        return;
    }

    try {
        const response = await fetch(id ? `${API_URL}/${id}` : API_URL, {
            method: id ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || error.title || "Unable to save drink.");
        }
        clearDrinkForm();
        await loadDrinks();
        alert("Drink saved successfully.");
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

async function deleteDrink(id) {
    if (!confirm("Delete this drink from the menu?")) return;
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Unable to delete drink.");
        await loadDrinks();
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

// ADMIN ORDER HISTORY
async function loadOrderHistory() {
    const container = document.getElementById("order-history-list");
    if (!container) return;
    container.textContent = "Loading orders...";
    try {
        const response = await fetch(ORDER_API_URL);
        if (!response.ok) throw new Error("Unable to load order history.");
        const orders = await response.json();
        if (!Array.isArray(orders) || !orders.length) {
            container.innerHTML = "<p>No orders have been saved yet.</p>";
            return;
        }
        container.innerHTML = orders.map(order => `
            <article class="order-card">
                <h3>${escapeHTML(order.orderNumber || `Order ${order.orderId}`)}</h3>
                <p>Customer: ${escapeHTML(order.customerName)}</p>
                <p>Phone: ${escapeHTML(order.phoneNumber || "Not provided")}</p>
                <p>Date: ${order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN") : ""}</p>
                <p>Total: <strong>${money(order.totalAmount)}</strong></p>
                <button type="button" onclick="viewOrder(${Number(order.orderId)})">View Details</button>
            </article>
        `).join("");
    } catch (error) {
        console.error(error);
        container.textContent = error.message;
    }
}

async function viewOrder(id) {
    const container = document.getElementById("order-details");
    if (!container) return;
    container.textContent = "Loading order...";
    try {
        const response = await fetch(`${ORDER_API_URL}/${id}`);
        if (!response.ok) throw new Error("Unable to load order details.");
        const order = await response.json();
        container.innerHTML = `
            <h2>Order ${escapeHTML(order.orderNumber || order.orderId)}</h2>
            <p><strong>Customer:</strong> ${escapeHTML(order.customerName)}</p>
            <p><strong>Phone:</strong> ${escapeHTML(order.phoneNumber || "Not provided")}</p>
            <p><strong>Date:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN") : ""}</p>
            <h3>Items</h3>
            ${(order.items || []).map(item => `<p>${escapeHTML(item.drinkName)} × ${Number(item.quantity)} — ${money(item.lineTotal)}</p>`).join("")}
            <hr>
            <p>Subtotal: <strong>${money(order.totalAmount)}</strong></p>
            <p>Paid: <strong>${money(order.amountPaid)}</strong></p>
            <p>Change: <strong>${money(order.changeAmount)}</strong></p>
        `;
    } catch (error) {
        console.error(error);
        container.textContent = error.message;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();

    const form = document.getElementById("drink-form");
    if (form) form.addEventListener("submit", saveDrink);

    loadDrinks();
    renderCart();
});
