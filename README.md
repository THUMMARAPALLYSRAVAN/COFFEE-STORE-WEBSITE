# Brew Bliss Coffee — Full Project

A complete ASP.NET Core Web API + SQL Server + HTML/CSS/JavaScript coffee shop demo.

## Requirements

- .NET 11 SDK
- SQL Server Express running as `SQLEXPRESS`
- Visual Studio Code (or Visual Studio)

## 1. Check SQL Server

Make sure the SQL Server Express service is running. The default connection string in `appsettings.json` is:

`Server=localhost\SQLEXPRESS;Database=CoffeeMachineDb;Trusted_Connection=True;TrustServerCertificate=True;`

If your SQL Server instance has a different name, update that connection string.

## 2. Open the project

Open the `CoffeeMachine.Api` folder in VS Code.

Open Terminal → New Terminal and run:

```powershell
dotnet restore
dotnet build
```

## 3. Run the application

```powershell
dotnet run --urls http://localhost:5000
```

Keep this terminal open while using the website.

## 4. Open the pages

- Customer website: http://localhost:5000
- Admin panel: http://localhost:5000/admin.html
- Health check: http://localhost:5000/api/health
- Drinks API: http://localhost:5000/api/drinks
- Orders API: http://localhost:5000/api/orders

On first startup, the app creates `CoffeeMachineDb` and inserts five sample drinks. The app uses EF Core `EnsureCreated`; it does not require migrations for this starter version.

## Features

- Customer menu loaded from SQL Server
- Add, remove and change cart quantities
- Demo cash payment with server-side price calculation
- Customer name required; phone number optional
- Orders and item snapshots saved in SQL Server
- Printable receipt
- Separate admin page for drink CRUD
- Admin order history and order details

## Important notes

- Payment is a demo cash workflow only. No real payment gateway is connected.
- The admin page is not password protected. Add authentication before using this outside a local demo.
- `EnsureCreated` is intended for a fresh starter database. If you later change entity schemas, use EF Core migrations or recreate the development database after backing up any orders.
- The app uses server-side drink prices when creating orders; the browser does not decide the final order total.
