---
title: About the SDK
slug: "/about-the-sdk/"
member: "PRO SDK Docs"
order: 2
description: "An introduction to the SortedPRO SDK."
keywords: "SDK, intro, introduction, Sorted, PRO, Overview, dependency, injection, dependencies, setup, getting started "
---

# About the SDK

Welcome to the SortedPRO SDK! Here you’ll find a brief overview of the SDK and what you can do with it.

If you just want to get integrating, check out the [Quick Start](https://docs.sorted.com/react/quick-start/) guide.

---

## SDK Architecture

The SortedPRO SDK is a .Net Standard 2.x library that enables you to use PRO's functionality in your applications. It is split into a series of services, of which each publishes its own data contracts and "mini-SDK". As such, you only need to reference the packages that you specifically require for your project, helping you to keep your dependency trees small.

### Service List

The full list of services in the SDK is:

* **Consignments** - Enables you to manage consignments, including creating, deleting, updating, and allocating to a carrier.
* **Labels** - Enables you to get consignment and packages labels
* **Orders** - Enables you to manage PRO orders, including, creating, deleting, updating, and packing into consignments,
* **Quotes** - Enables you to get quotes based on a consignment reference or specific details.
* **Rates** - Enables you to reset the Rates cache.
* **Reconciliation** - Enables you to get a list of invoices for a particular customer
* **Security** - Enables you to manage user accounts and configure roles.
* **Settings** - Enables you to administer your organisation's carriers, carrier services, collection calendars, packages sizes, service groups, and shipping locations.
* **Shared** - Contains shared components used by all PRO mini-SDKs.
* **Tracking** - Enables you to get tracking events for your consignments.
* **Webhooks** - Enables you to configure push tracking notifications via webhook.
* **XmlValidation** - Enables you to get the embedded XML schema.

When referencing a particular service, you must also reference its `DataTypes` (i.e. the data contract for that service) and `Interfaces`. For example, to use `Consignments` functionality you would need to reference the following:

* `Sorted.PRO.SDK.Consignments` 
* `Sorted.PRO.SDK.Consignments.Interfaces`
* `Sorted.PRO.SDK.Consignments.DataTypes`

Alternatively, you can reference the master package set, `Sorted.PRO.SDK`. This package set references all of PRO's "mini-SDKs", enabling you to consume the SDK with minimal package references and without requiring knowledge of the individual services.

### Common Dependencies

Many of the "mini-SDK" packages are dependent on a common SDK, which can be referenced at `Sorted.PRO.SDK.Shared` and `Sorted.PRO.SDK.DataTypes.Common`. See the SDK reference documentation for specific dependency information.

The following dependencies are common to almost all of the services in the PRO SDK. They are located in the `Sorted.Pro.SDK.Shard.Interfaces` package:

* `ILogger` - Responsible for logging diagnostic information. Implementing `ILogger` enables you to connect to PRO's inbuilt logging. For example, you could provide an implementation that writes PRO logging messages into your own logging pipeline. Alternatively, you can use the provided `SdkReferenceLogger`, which logs to the console. 

* `IHttpClientFactory` - Responsible for efficient re-use of HTTP connections. The SDK' `Sorted.PRO.SDK.Shared` package includes a default implementation called `HttpClientFactory`. We recommend that you use the provided implementation, rather than implementing this interface yourself. 

     > <span class="note-header">Note:</span>
     > 
     > The PRO SDK's `IHttpClientFactory` is distinct from the interface and implementation of the same name that is now available within .NET Core. The PRO `IHttpClientFaactory` was added to the SDK a result of a high-impact performance improvement that Sorted undertook in order to make the system's use of HTTP connections more efficient.

* `IEndpoints` - Enables you to specify the locations that the SDK sends HTTP requests to. For example, you might want to implementing `IEndpoints` yourself in order to have PRO send requests to your own internal systems for testing purposes. The SDK includes default implementations for production (`Production.Instance`) and sandbox (`Sandbox.Instance`) environments. 

## Dependency Injection

The PRO SDK is designed to be used with a dependency injection framework. All services have a corresponding interface, named with the `I{serviceName}` convention. For example, to create consignments you would use the `IConsignmentService` interface, which is in turn implemented by the concrete `ConsignmentService` class. 

## Asynchronous Methods 

The SDK includes both synchronous and asynchronous methods. We strongly recommend that you only utilise the asynchronous methods, as this will enable you to achieve far higher throughput on your own systems. The synchronous methods are only included to support scenarios where it is not possible for you to use asynchronous code. 

## API Docs

For further information on PRO's APIs, see the [API Reference](https://docs.electioapp.com/#/api) and PRO Call Flow documentation.