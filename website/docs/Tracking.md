# Tracking Entities

Metadatify has functionality to track phsyical Entities via unique identifiers and a barcode or QR code scanner.

## Entity Identifiers

Every Entity, regardless of the name, has a unique identifier. This identifier is primarily used internally to store the Entity in the database, however the identifier protocol has been setup to be usable within a QR code.

## Scanning QR Codes

The sidebar of Metadatify has a "Scan" button, under the "Tools" section. Clicking this button will open the scan modal:

![Scan Modal](../img/scan_modal.png)

The scan modal listens for input from the scanner module, and it provides the option "Enter manually" for manual input of an identifier.

A scanner module can be connected to a computer via a USB cable. When connected, a successful read of a barcode or QR code will emit text input to the browser, as if the scanner were a keyboard.

Upon receiving input from either the scanner or manual input, the modal will close and Metadatify will search for the Entity with the identifier. If an Entity is found, the modal will close and the Entity will be displayed.

## Generating Labels

Metadatify does not have a built-in label creation feature. However, the "Export" button on an Entity's page allows for the export of metadata in a CSV format. This CSV can be imported into label-making software.

The "Share" button under the yellow "Actions" button displays a modal containing a QR code and a shareable link to the Entity:

![Share Modal](../img/share_modal.png)

The QR code can be scanned with a barcode scanner to quickly access the Entity. The shareable link can be used to access the Entity from any device with a web browser.
