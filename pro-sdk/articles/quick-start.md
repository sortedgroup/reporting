---
title: Quick Start
slug: "/quick-start/"
member: "PRO SDK Docs"
order: 1
description: "Get started with the SortedPRO SDK."
keywords: "SDK, intro, introduction, Sorted, PRO, quick, start, quickstart, quick start, getting, started, getting started, setup, setting up "
---

# Quick Start

Ready to get started with the SortedPRO SDK? This page explains how to set the SDK up and create a simple app to create, allocate, get labels for, and manifest a consignment.

This page is based on PRO's **Classic** workflow. For more information on this workflow, see the [PRO Call Flow](https://sorted-pro-flows-demo.herokuapp.com/#classic-flow) docs.

---

## Sample Application

This guide is intended to be used in conjunction with the Classic Flow sample application, available from [LINK HERE]. This app shows the **Classic** PRO workflow implemented using the PRO SDK.

## Downloading the SDK

The PRO SDK is available as a collection of NuGet packages. For information on the specific packages you need for your project, see the SDK reference docs and the SDK Architecture section of the About the SDK page. 

Alternatively, you can reference the master package set, `Sorted.PRO.SDK`. This package set references all of PRO's "mini-SDKs", enabling you to consume the entire SDK with minimal package references and without requiring knowledge of its individual services.

> <span class="note-header">More Information:</span>
>
> For help on consuming packages from NuGet, see the [NuGet documentation](https://docs.microsoft.com/en-us/nuget/consume-packages/overview-and-workflow).

## Configuration

Many of the SDK's services require an `apiKey` as a dependency. The sample application uses an extension method called `RegisterApiKeyDependentService` to register those services that are dependent on an `apiKey`. The method is defined in `RegistrationHelper.cs` as follows:

```c#
public static class RegistrationHelper
    {
        /// <summary>
        /// Registers a service that is dependent on an API key
        /// </summary>
        /// <param name="container">The <see cref="IWindsorContainer"/> to register with</param>
        /// <param name="configuration">The <see cref="IConfigurationRoot"/> used to obtain the API key</param>
        /// <typeparam name="TInterface">The interface to register</typeparam>
        /// <typeparam name="TConcrete">The concrete implementation of the interface</typeparam>
        public static void RegisterApiKeyDependentService<TInterface, TConcrete>(
            this IWindsorContainer container, IConfigurationRoot configuration
        )
        {
            var apiKey = ConfigReader.GetApiKey(configuration);
            RegisterApiKeyDependentService<TInterface, TConcrete>(container, apiKey);
        }

        public static void RegisterApiKeyDependentService<TInterface, TConcrete>(
            this IWindsorContainer container, string apiKey) {
            container.Register(
                Component.For(typeof(TInterface))
                    .ImplementedBy(typeof(TConcrete))
                    .DynamicParameters((k, d) => d["apiKey"] = apiKey)
            );
        }
    }
```

Note that this is part of the sample application provided, rather than the SDK itself.

`RegisterApiKeyDependentService` is then called in `ApplicationContainer.cs`, once for every service that needs to be registered in order for the app to run.

```java
/// <summary>
/// Register the Sorted.PRO services
/// </summary>
/// <param name="configuration">The <see cref="IConfigurationRoot"/> used to get app configuration</param>
private void RegisterServices(IConfigurationRoot configuration)
{
    //using an extension method to register these services
    _container.RegisterApiKeyDependentService<IConsignmentService, ConsignmentService>(configuration);
    _container.RegisterApiKeyDependentService<IQuoteService, QuoteService>(configuration);
    _container.RegisterApiKeyDependentService<ILabelService, LabelService>(configuration);
    _container.RegisterApiKeyDependentService<IShippingLocationsService, ShippingLocationsServiceService>(configuration);
    _container.RegisterApiKeyDependentService<IConsignmentAllocationService, ConsignmentAllocationService>(configuration);
    _container.RegisterApiKeyDependentService<ICarrierServiceService, CarrierServiceService>(configuration);
    _container.RegisterApiKeyDependentService<ITrackingService, TrackingService>(configuration);
}

```

## Creating a Consignment

Many of PRO's key workflows require you to create a consignment object as an initial step. The `CreateConsignmentSample.cs` sample application file demonstrates how to create a consignment using the SDK.

In the PRO SDK, consignments are created by sending a `CreateConsignmentRequest` object to the [Create Consignment](https://docs.electioapp.com/#/api/CreateConsignment) endpoint via the `IConsignmentService.CreateConsignmentAsync(request)` method. The basic steps to create a consignment via the SDK are: 

1. Create a new instance of the `IConsignmentService`. In the sample application, this is done via dependency injection.

    ```java
    public class CreateConsignmentSample : ICreateConsignmentSample
    {
        private readonly IConsignmentService _consignmentService;
        private readonly ISortedConfiguration _configuration;

        public CreateConsignmentSample(
            IConsignmentService consignmentService,
            ISortedConfiguration configuration)
        {
            _consignmentService = consignmentService;
            _configuration = configuration;
    }
    ```

2. Create a new `CreateConsignmentRequest`. This object contains the details of the consignment to be created. For details on the structure of the `CreateConsignmentRequest`, see SDK REFERENCE LINK HERE.

    The example below shows a simple consignment request for an outbound shipment containing a single package.

    ```java
    public CreateConsignmentRequest BuildCreateConsignmentRequest(string postcode)
    {   
        var createConsignmentRequest = new CreateConsignmentRequest
        {
            Direction = ConsignmentDirection.Outbound,
            Addresses = new List<Address> //all consignments must have at least 2 addresses
            {
                new Address
                {
                    ShippingLocationReference = _configuration.ShippingLocationReference,
                    AddressType = ConsignmentAddressType.Origin //must include an origin address
                },
                new Address
                {
                    AddressType = ConsignmentAddressType.Destination, //must include a destination address
                    AddressLine1 = "123 Some Street",
                    Town = "Manchester",
                    Region = "Greater Manchester",
                    Postcode = postcode,
                    Country = new Country("GB"),
                    Contact = new Contact()
                    {
                        Title = "Mr",
                        FirstName = "Tester",
                        LastName = "McTest",
                        Email = "tester.mctest@sorted.com",
                        Telephone = "0161123456"
                    }
                }
            },
            Packages = new List<Package>
            {
                new Package
                {
                    Weight = new Weight(1.5M),
                    Dimensions = new Dimensions(10,10,10),
                    Description = "A sample package",
                    Value = new Money(new Currency("GBP"), 2.99M),
                    PackageReferenceProvidedByCustomer = Guid.NewGuid().ToString()
                }
            },
            ConsignmentReferenceProvidedByCustomer = "my_reference"
        };

        return createConsignmentRequest;
    }
    ```
3. Use the `IConsignmentService.CreateConsignmentAsync(request)` method to pass the `CreateConsignmentRequest` to the [Create Consignment](https://docs.electioapp.com/#/api/CreateConsignment) API endpoint . PRO creates the consignment based on the details in the `CreateConsignmentRequest`and returns an `apiLink` detailing the consignment's reference and a link to the full consignment details.
4. Extract the consignment reference from the API's response. PRO consignment references are a unique identifier for each consignment in the system, and have the format `EC-XXX-XXX-XXX`. The code sample below uses a regular expression to extract the consignment reference from the API's response.

    ```java
    private static string ExtractConsignmentReference(ApiLink apiLink)
    {
        var href = apiLink.Href;
        var regex = new Regex("EC-[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{3}$");
        var match = regex.Match(href);
        if (!match.Success)
        {
            throw new Exception($"Could not extract consignment reference from apiLink {href}");
        }

        return match.Value;
    }
    ```

## Allocating a Consignment

Once you've created a consignment, it must be allocated to a carrier service. PRO has multiple allocation endpoints, giving you the flexibility to allocate to carriers using whatever criteria suits you best. 

This example and the `AllocateConsignmentSample.cs` sample application file demonstrates how to allocate a consignment using the **Allocate With Default Rules** endpoint, which allocates the consignment to the cheapest service that meets your organisation's allocation rules. For more information on PRO's other allocation options, see the [API Reference](https://docs.electioapp.com/#/api/AllocateConsignment).

> <span class="note-header">Note:</span>
> 
> In the context of SortedPRO, **allocation** is the process of selecting the carrier service that will be used to deliver the consignment.

In the PRO SDK, consignments can be allocated by passing a consignment reference to the [Allocate Consignment](https://docs.electioapp.com/#/api/AllocateConsignment) endpoint via the `IConsignmentAllocationService.AllocateConsignmentAsync(reference)` method. The basic steps to allocate a consignment via the SDK are: 

1. Create a new instance of the `IConsignmentAllocationService`. In the sample application, this is done via dependency injection.

    ```java
    private readonly IConsignmentAllocationService _consignmentAllocationService;

    public AllocateConsignmentSample(IConsignmentAllocationService consignmentAllocationService)
    {
        _consignmentAllocationService = consignmentAllocationService;
    }
    ```

2. Use the `IConsignmentAllocationService.AllocateConsignmentAsync(reference)` method to pass a consignment reference to the [Allocate Consignment](https://docs.electioapp.com/#/api/AllocateConsignment) API endpoint. 

    ```java
    public async Task<AllocationSummary> AllocateConsignment(string consignmentReference)
    {
        return await OperationHelper.Execute(async () =>
        {
            var allocationResult =
                await _consignmentAllocationService.AllocateConsignmentAsync(consignmentReference);
            JsonSampler.SummariseToJson(allocationResult);
            var first = allocationResult.FirstOrDefault();
            WriteAllocationSummary(first);
            return first;
        });
    }
    ```  
    PRO allocates the consignment and returns an `AllocationSummary`, which contains links to the consignment resource that was allocated, a summary of the carrier service that the consignment was allocated to, a link to the relevant package labels, and a `ConsignmentLegs` array indicating how many legs the shipment will need.  

3. Read the `AllocationSummary` object to find the details of the carrier name, reference, service and service name.

    ```java
    private static void WriteAllocationSummary(AllocationSummary summary)
    {
        WriteProperty("Carrier name", summary.CarrierName);
        WriteProperty("Carrier reference", summary.CarrierReference);
        WriteProperty("Carrier service", summary.CarrierServiceName);
        WriteProperty("Carrier service reference", summary.CarrierServiceReference);
        WriteProperty("Description", summary.Description);
    }

    private static void WriteProperty(string property, string value)
    {
        Console.WriteLine($"Property '{property}' has value '{value}'");
    }
    ```

Once allocated, the consignment's status changes to *Allocated*.

## Getting Consignment Labels

When a consignment is allocated, SortedPRO generates labels for each package in that consignment. The next step in the process is to retrieve those delivery labels. This example and the `GetLabelsSample.cs` sample application file demonstrates how to retrieve labels using the `LabelService`.

The basic steps to get consignment labels via the SDK are: 

1. Create a new instance of the `ILabelService`. In the sample application, this is done via dependency injection.

    ```java
    private readonly ILabelService _labelService;

    public GetLabelsSample(ILabelService labelService)
    {
        _labelService = labelService;
    }
    ```

2. Use the `ConsignmentAllocationService.AllocateConsignmentAsync(reference, format)` method to pass a `consignmentReference`, a `labelFormat` and a `resolution` (in dots per inch) to the [Allocate Consignment](https://docs.electioapp.com/#/api/AllocateConsignment) API endpoint.

In the example below, PRO will respond by sending label data for the relevant `consignmentReference` as a PDF with a resolution of 203 dpi.

    ```java
    public async Task GetLabels(string consignmentReference, bool open = true)
    {
        await OperationHelper.Execute(async () =>
        {
            var labelData = await _labelService.GetConsignmentLabelsAsync(consignmentReference, LabelFormat.PDF, 203);
            SummariseLabels(labelData);
            JsonSampler.SummariseToJson(labelData);
            if (open)
            {
                OpenLabel(labelData, consignmentReference);
            }
        });
    }     
    ```
    PRO returns a `GetLabelsResponse` containing all package labels associated with the specified consignment as a base64-encoded byte array in the format requested. 

3. Save the file to disk or to a remote location.

    ```java
    private static string SaveFile(byte[] contents, string consignmentReference)
    {
        try
        {
            var path = System.IO.Path.GetTempPath();
            var fileName = $"{Guid.NewGuid():N}-{consignmentReference}.pdf";
            var filePath = System.IO.Path.Combine(path, fileName);
            System.IO.File.WriteAllBytes(filePath, contents);
            return filePath;
        }
        catch (Exception e)
        {
            Console.WriteLine(e);
            throw;
        }
    }    
    ```

## Manifesting a Consignment

Once you've created a consignment, allocated it to a carrier service and printed labels for it, you're ready to manifest it. The `ManifestSample.cs` sample application file demonstrates how to manifest a consignment using the SDK.

> <span class="note-header">Note:</span>
> 
> In the context of SortedPRO, the term "manifest" refers to advising the carrier that the consignment in question needs to be collected from the shipper.

In the PRO SDK, consignments are manifested by sending a `ManifestConsignmentsRequest` object to the [Manifest Consignments](https://docs.electioapp.com/#/api/ManifestConsignments) endpoint via the `IConsignmentService.ManifestConsignmentsAsync(request)` method. The basic steps to manifest a consignment via the SDK are:

1. Create a new instance of `IConsignmentService`. In the sample application, this is done via dependency injection.

    ```java
    private readonly IConsignmentService _consignmentService;

    public ManifestSample(IConsignmentService consignmentService)
    {
        _consignmentService = consignmentService;
    }
    ```

2. Construct a new `ManifestConsignmentsRequest`. This object contains the references of the consignments to be manifested. For details on the structure of the `ManifestConsignmentsRequest`, see LINK HERE.
3. Use the `IConsignmentService.ManifestConsignmentsAsync(request)` method to pass the `ManifestConsignmentsRequest` to the [Manifest Consignments](https://docs.electioapp.com/#/api/ManifestConsignments) endpoint.

    ```java
    public async Task ManifestConsignment(string consignmentReference)
    {
        await OperationHelper.Execute(async () =>
        {
            var result = await _consignmentService.ManifestConsignmentsAsync(new ManifestConsignmentsRequest()
            {
                ConsignmentReferences = new List<string>
                {
                    consignmentReference
                }
            });
            PrintResults(result);
            JsonSampler.SummariseToJson(result);
        });
    ```
    PRO attempts to manifest all of the consignments in the request, and returns a message indicating how many consignments could be manifested.

4. View the results of the operation.

    ```java
    private static void PrintResults(IEnumerable<WithMessage<string>> manifestResponse)
    {
        foreach (var result in manifestResponse)
        {
            Console.WriteLine($"Manifested: {result.IsSuccess}. Message: {result.Message}");
        }
    }
    ```

We have only scratched the surface of what you can do with the PRO SDK in this tutorial. Read on to learn how to manage orders, quotes, and delivery options. 