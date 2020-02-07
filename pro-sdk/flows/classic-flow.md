# Classic Flow

![Flow1](../../images/Flow1.png)

Creating a new consignment, allocating it to a suitable carrier service, and then adding it to that service's manifest is perhaps PRO's most basic use case. The **Classic** call flow offers the lightest integration design of all PRO flows, making it easy for your organisation to manage deliveries across multiple carriers.

> <span class="note-header">Note:</span>
>
> This guide assumes that you have already consumed the PRO SDK packages and performed the initial setup steps. If you have not done so, please see the **LINK HERE** page before continuing.

The **Classic** flow is most useful to your business if:

* You have a single warehouse / fulfilment centre.
* You use a static delivery promise (e.g. Next day delivery before 5pm).
* You want to keep your business logic and technology architecture as simple as possible.

There are four steps to the flow:

1. **Create the consignment** - Use the `ConsignmentService.CreateConsignmentAsync` method to record the details of your new consignment.
2. **Allocate the consignment** - Use one of the allocation methods in the `ConsignmentAllocationService` to select the carrier service that your consignment will use. You can nominate a specific service, ask PRO to determine the best service to use from a pre-defined group, or allocate based on pre-set allocation rules.
3. **Get the consignment's labels** - Use the `LabelService.GetConsignmentLabelsAsync` method to get the delivery label for your consignment.
4. **Manifest the consignment** - Use the `ConsignmentService.ManifestConsignmentsAsync` method to to confirm the consignment with the selected carrier. At this point, the consignment is ready to ship.

## Creating a Consignment

The first step toward manifesting a consignment is to create that consignment in SortedPRO. 

> <span class="note-header">More Information:</span>
>
> In the context of PRO, the term <strong>"consignment"</strong> refers to a collection of one or more packages that are shipped from the same origin address, to the same destination address, on behalf of the same Sorted customer, using the same carrier service, on the same day.
>  
> A <strong>package</strong> is an <strong>item</strong> or a collection of items, wrapped or contained together for shipment. Each package can contain one or more items. 
>
> As an example, suppose that a clothing retailer has received a customer order for a necklace, a bracelet, a coat, and a hat. As the necklace and bracelet are both physically small, the retailer elects to ship them in the same package. As such, this sales order would break down to:
>
> * Four items - The necklace, the bracelet, the coat, and the hat.
> * Three packages - One containing the necklace and bracelet, one containing the coat, and one containing the hat.
> * A single consignment corresponding to everything on the order.

You can create a consignment by using the `ConsignmentService.CreateConsignmentAsync` method to send a [CreateConsignmentRequest](/../pro-sdk/ref-consignments/Sorted.PRO.SDK.DataTypes.Consignments.CreateConsignmentRequest.html) to PRO's [Create Consignments](https://docs.electioapp.com/#/api/CreateConsignment) API. PRO uses the information in the `CreateConsignmentRequest` to generate a consignment and return an [APILink](/../pro-sdk/ref-shared/Sorted.PRO.SDK.DataTypes.Common.ApiLink.html) object, which contains the new consignment's `{consignmentReference}`.

### Example Implementation

The examples below how the PRO SDK sample app handles consignment creation. The sample app has a `CreateConsignment` task class performs three main functions: using a `BuildCreateConsignmentrequest` method to generate a new `CreateConsiognmentRequest`, sending that request to the API endpoint via `consignmentService.CreateConsignmentAsync`, and extracting the `{consignmtnReference}` from the information returned by using an `ExtractConsignmentReference` method.

```c#
/// <summary>
/// Creates a new consignment and returns the Sorted-generated reference
/// <remarks>
/// Sorted.PRO consignment references have the format EC-XXX-XXX-XXX
/// </remarks>
/// </summary>
/// <returns>The reference of the generated consignment</returns>
public async Task<string> CreateConsignment(string postcode)
{
    return await OperationHelper.Execute(async () =>
    {
        var request = BuildCreateConsignmentRequest(postcode);
        JsonSampler.SummariseToJson(request);
        var result = await _consignmentService.CreateConsignmentAsync(request);
        JsonSampler.SummariseToJson(result);

        var apiLink = result.FirstOrDefault();
        var reference = ExtractConsignmentReference(apiLink);
        Console.WriteLine($"Created consignment with reference: {reference}");
        return reference;
    });
}
```
### Building The Request

In the below example, we have added origin address, destination address (denoted by the `AddressType` property), and package dimensions as part of the `CreateConsignmentRequest`. This is the minimum amount of information that PRO requires to create a consignment.

```c#
/// <summary>
/// Builds a new <see cref="CreateConsignmentRequest"/>
/// </summary>
/// <returns>A populated <see cref="CreateConsignmentRequest"/></returns>

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

However, there are lots of other properties you can send when creating a consignment, including:

* Your own consignment reference.
* The consignment's source.
* Shipping and delivery dates.
* Customs documentation.
* The consignment's direction of travel.
* Metadata. PRO metadata enables you to us custom fields to record additional data about a consignment. For more information on using metadata in PRO, see [LINK HERE].
* Tags. Allocation tags enable you to filter the list of carrier services that a particular consignment could be allocated to. For more information on allocation tags, see [LINK HERE]].

> <span class="note-header">Note:</span>
> For full reference information on the <strong>Create Consignment</strong> endpoint, including a list of all properties accepted by the endpoint, see the <strong><a href="https://docs.electioapp.com/#/api/CreateConsignment">Create Consignment</a></strong> page of the API reference.

Either the consignment's `origin` address, its `destination` address, or both, must include a valid `ShippingLocationReference`. You can get a list of your organisation's `ShippingLocationReferences` using the <strong><a href="https://docs.electioapp.com/#/api/GetShippingLocations">Get Shipping Locations</a></strong> API endpoint.

### Processing the Response

The following example shows an `APILink` object that has been generated as a result of a `CreateConsignmentRequest`:

```json
[
  {
    "Rel": "Link",
    "Href": "https://api.electioapp.com/consignments/EC-000-087-01A"
  }
]
```

The example `ExtractConsignmentReference`method show below reads this object and returns the new consignment's `consignmentReference` property. The `{consignmentReference}` is a unique identifier for that consignment within PRO, and is a required parameter for many of PRO's API requests. Each PRO `{consignmentReference}` takes the format `EC-xxx-xxx-xxx`.

```c#
/// <summary>
/// Uses a regular expression to extract the generated consignment reference from the response
/// </summary>
/// <param name="apiLink">The link that points to the generated consignment</param>
/// <returns>The consignment reference in the format EC-XXX-XXX-XXX</returns>
/// <exception cref="Exception">Thrown if no valid reference is matched</exception>
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

Now that the consignment has been created and its `consignmentReference` obtained, it is ready to be allocated. 

## Allocating a Consignment

Once you've created a consignment, it must be allocated to a carrier service. In the context of SortedPRO, <strong>allocation</strong> is the process of selecting the carrier service that will be used to deliver the consignment.

PRO has multiple allocation endpoints, giving you the flexibility to allocate to carriers using whatever criteria suits you best. This example flow uses the `consignmentAllocationService.AllocateConsignmentAsync(consignmentReference)` method, which allocates the selected consignment using pre-configured default allocation rules. For information on other ways to use the `consignmentAllocationService.AllocateConsignmentAsync` method, see the [IAllocationService](/../pro-sdk/ref-consignments/Sorted.PRO.SDK.Interfaces.Consignments.IConsignmentAllocationService.html) interface reference.

### Request

When you pass a `consignmentReference` to the `consignmentAllocationService.AllocateConsignmentAsync` method, PRO generates an [AllocateConsignmentsRequest](/../pro-sdk/ref-consignments/Sorted.PRO.SDK.DataTypes.Consignments.AllocateConsignmentsRequest.html) and sends it to the [Allocate Using Default Rules](https://docs.electioapp.com/#/api/AllocateUsingDefaultRules) endpoint. PRO then allocates the consignment to the cheapest available service that meets your organisation's allocation rules.

> <span class="note-header">Note:</span>
>
> PRO allocation rules enable you to configure business rules - such as physical package size, consignment value, and geographical availability - against individual carrier services. You can configure them via the [Manage Carrier Service Rules](https://www.electioapp.com/Configuration/EditCarrierService/acceptanceTestCarrier_f8fe) page of the PRO UI.
>
> For more information on configuring allocation rules, see the <em>Configure Allocation Rules</em> section of the PRO Admin Portal User Guide.

### Response

Once the consignment has been allocated, PRO returns an [AllocationSummary](/../pro-sdk/ref-consignments/Sorted.PRO.SDK.DataTypes.Consignments.AllocateConsignmentsRequest.html). The `AllocationSummary` contains links to the consignment resource that was allocated, a summary of the carrier service that the consignment was allocated to, a link to the relevant package labels, and a `ConsignmentLegs` array indicating how many legs the shipment will need. Where a shipment would need multiple legs to complete, the `ConsignmentLegs` array shows tracking details for each individual leg.

Example Allocation Summary Response
```json
[
    {
        "StatusCode": 200,
        "ApiLinks": [
            {
                "Rel": "detail",
                "Href": "https://apisandbox.electioapp.com/consignments/EC-000-05B-MMA"
            },
            {
                "Rel": "label",
                "Href": "https://apisandbox.electioapp.com/labels/EC-000-05B-MMA"
            }
        ],
        "Description": "Consignment EC-000-05B-MMA has been successfully allocated with Carrier X Next Day Super for shipping on 14/06/2019 17:00:00 +00:00",
        "ConsignmentLegs": [
            {
                "Leg": 1,
                "TrackingReferences": [
                    "TRK00009823"
                ],
                "CarrierReference": "CARRIER_X",
                "CarrierServiceReference": null,
                "CarrierName": "Carrier X"
            }
        ],
        "CarrierReference": "CARRIER_X",
        "CarrierName": "Carrier X",
        "CarrierServiceReference": "CX_NDS",
        "CarrierServiceName": "Next Day Super"
    }
]
```

Once allocated, the consignment's status changes to _Allocated_, enabling you to retrieve its package labels and (where applicable) customs documentation.

### Example Implementation

The example below shows how the SDK sample app allocates consignments.
```c#
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

In this example, the `AllocateConsignment` task class handles the allocation request and then uses additional `WriteAllocationSummary` and `WriteProperty` methods to generate a summary of the allocated service, which can then be output to the console.

## Getting a Consignment's Labels

When a consignment is allocated, SortedPRO generates labels for each package in that consignment. The next step in the process is to retrieve those delivery labels via the `LabelService.GetConsignmentLabelsAsync` method, so that they can be printed and physically applied to the relevant packages.

The `LabelService.GetConsignmentLabelsAsync` method takes a `consignmentReference`, a `labelFormat`, and a `resolution` as parameters, uses them to create a [LabelsRequest](/../pro-sdk/ref-labels/Sorted.PRO.SDK.DataTypes.Labels.LabelsRequest.html), and then sends that request to PRO's Labels API. 

PRO then returns a [GetLabelResponse](/../pro-sdk/ref-labels/Sorted.PRO.SDK.DataTypes.Labels.GetLabelsResponse.html), containing all package labels associated with that consignment as a base64-encoded byte array in the format and resolution requested.

Valid `LabelFormat`s can be found in the [LabelFormat](/../pro-sdk/ref-labels/Sorted.PRO.SDK.DataTypes.Labels.LabelFormat.html) enum.

> <span class="note-header">Note:</span>
> For full reference information on the <strong>Get Labels in Format</strong> endpoint of PRO's Labels API, see the <strong><a href="https://docs.electioapp.com/#/api/GetLabelsinFormat">Get Labels in Format</a></strong> page of the API reference.

### Example Implementation

The example below shows how the SDK sample app makes label requests. The `GetLabels` task class makes the `GetConsignmentLabelsAsync` call (in this example for a PDF label at 203 DPI resolution), and uses and `OpenLabel` method to automatically open the returned label, ready for printing:

```c#
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

The `OpenLabel` method itself validates the returned file to confirm that it is a PDF, saves the file to disk by way of an additional `SaveFile` method, and opens the file.

```c#
        /// <summary>
        /// Opens a label
        /// </summary>
        /// <param name="response">The <see cref="GetLabelsResponse"/> containing the label data</param>
        /// <param name="consignmentReference">The reference of the consignment this label relates to</param>
        private static void OpenLabel(GetLabelsResponse response, string consignmentReference)
        {
            if (!response.ContentType.Contains("pdf"))
            {
                Console.WriteLine($"This method only supports PDF labels. The provided type was '{response.ContentType}'");
                return;
            }

            var filePath = SaveFile(response.File, consignmentReference);
            Console.WriteLine($"File saved to {filePath}");
            Process.Start(new ProcessStartInfo(filePath)
            {
                UseShellExecute = true
            });
        }

        /// <summary>
        /// Saves the raw file data to disk
        /// </summary>
        /// <param name="contents">The file contents <see cref="Byte[]"/></param>
        /// <param name="consignmentReference">The reference of the related consignment</param>
        /// <returns>The file path of the saved file</returns>
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

Once you've created a consignment, allocated it to a carrier service and printed labels for it, you're ready to manifest it. In the context of SortedPRO, the term "manifest" refers to advising the carrier that the consignment in question needs to be collected from the shipper. To manifest a consignment, use the [`ConsignmentService.ManifestConsignmentsAsync`](/../pro-sdk/ref-consignments/Sorted.PRO.SDK.Consignments.ConsignmentService.html#Sorted_PRO_SDK_Consignments_ConsignmentService_ManifestConsignmentsAsync_Sorted_PRO_SDK_DataTypes_Consignments_ManifestConsignmentsRequest_) method. 


> <span class="note-header">Note:</span>
> In this example flow we will look at manifesting consignments by simply supplying `ManifestConsignmentsAsync` with a list of consignment references. However, it is also possible to manifest consignments by providing `ManifestConsignmentsAsync` with a set of query parameters. 
>
> For more information on using `ManifestConsignmentsAsync`, see the [Consignments SDK Reference](/../pro-sdk/ref-consignments/index.html)

### Request

INFO IN HERE

### Response

Once PRO has attempted to add the consignments to the manifest queue, the **Manifest Consignments From Query** endpoint returns a `Message` indicating how many consignments met the terms of the query and how many it was able to queue. It also returns a `FailedConsignments` array listing the `consignmentReferences` of those consignments that PRO was unable to queue for manifest.

> <span class="note-header">Note:</span>
> For full reference information on the Consignments API's <strong>Manifest Consignments From Query</strong> endpoint, see the <strong><a href="https://docs.electioapp.com/#/api/ManifestConsignmentsFromQuery">Manifest Consignments From Query</a></strong> page of the API Reference. 

### Example Implementation

The example below shows how the SDK sample app manifests consignments.

```c#
/// <summary>
/// Manifests the specified consignment
/// </summary>
/// <param name="consignmentReference">The reference of the consignment to manifest</param>
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
}    


/// <summary>
/// Summarise the results of the operation
/// </summary>
/// <param name="manifestResponse">The <see cref="IEnumerable{WithMessage{string}}"/> to summarise</param>
private static void PrintResults(IEnumerable<WithMessage<string>> manifestResponse)
{
    foreach (var result in manifestResponse)
    {
        Console.WriteLine($"Manifested: {result.IsSuccess}. Message: {result.Message}");
    }
}
```

In this example, the `ManifestConsignment` task class handles the manifest request, passing a single `consignmentReference` to PRO. The task then makes use of an additional `PrintResults` method to display the results of the operation via the console.