# Labels
* [Data Types (Sorted.PRO.SDK.DataTypes.Labels)](/pro-sdk/reference/ref-labels/Sorted.PRO.SDK.DataTypes.Labels.html)
* [Interfaces (Sorted.PRO.SDK.Interfaces.Labels)](/pro-sdk/reference/ref-labels/Sorted.PRO.SDK.Interfaces.Labels.html)
* [Service (Sorted.PRO.SDK.Labels)](/pro-sdk/reference/ref-labels/Sorted.PRO.SDK.Labels.html)

---

SortedPRO can generate despatch labels for all of its carriers, enabling PRO customers to download labels without having to request them directly from the carrier. The **LabelService** enables you to get labels for a specific consignment or an individual package within a consignment.

Getting labels is a key part of all PRO workflows, as an unlabelled consignment cannot be dispatched. Labels are usually retrieved after a consignment has been allocated but before it has been manifested.

> <span class="note-header">Note: </span>
> 
> You can only retrieve labels for consignments that have been allocated to a carrier. If you attempt to return labels for an unallocated consignment, PRO returns an error.

## Methods

The labels service has two methods:

* `GetConsignmentLabelsAsync` - Returns the labels for all packages in the specified consignment, in the specified format and resolution.
* `GetPackageLabelAsync` - Returns the label for an individual package, in the specified format and resolution.

### Parameters

Both of these methods require the following parameters:

* `consignmentReference` - The unique reference of the consignment you want to get labels for. PRO consignment references take the format `EC-XXX-XXX-XXX`. 
    > <span class="note-header">Note:</span>
    >
    > The `consignmentReference` is initially returned when creating a consignment via the [Consignments.CreateConsignmentAsync](/../pro-sdk/ref-consignments/Sorted.PRO.SDK.Consignments.ConsignmentService.html#Sorted_PRO_SDK_Consignments_ConsignmentService_CreateConsignmentAsync_Sorted_PRO_SDK_DataTypes_Consignments_CreateConsignmentRequest_) method. Alternatively, you can obtain a `consignmentReference` by making a call to the [Get Consignments Reference](https://docs.electioapp.com/#/api/GetConsignmentsReferences) API.
* `labelFormat` - The label format required. This must be one of PRO's supported formats. PRO's list of supported formats is defined in the [LabelFormat](/Sorted.PRO.SDK.DataTypes.Labels.LabelFormat.html) enum.
* `resolution` - The resolution of the label.

The `GetPackageLabelAsync` method also requires a `packageReference` property. This is the unique reference of the package you want to get a label for, and takes the format `EP-XXX-XXX-XXX`. The specified package must be part of the specified consignment.

### Response

Both **LabelService** methods return a `GetLabelsResponse`. The `GetLabelsResponse` has two properties:

* `File` - A base64-encoded byte array representing the file content.
* `ContentType` - The content type of the file (as specified in the calling method's `labelFormat` parameter).

## Using the Label Data

Once you have obtained the raw label data, you will need to perform some processing in order to use it. The below example shows sample methods to read the data, write it to disk, and automatically open the label file so it can be printed and applied to the relevant package.

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


