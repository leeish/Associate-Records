# Associate-Records
Configurable workflow action to associate one or more matching records based on a matching value in properties on both records.

## Configuration
All the required configuration for the action happens on [lines 4-12](https://github.com/leeish/Associate-Records/blob/59742c3fbcfc4534e19121b392368956fa045423/workflow-action.js#L4C1-L12C23).

### SECRETNAME
A String that should match the name of secret configured in your workflow action. You can choose to include or exclude `Bearer` from your secret value.

### ASSOCIATIONTYPE
An Object that can either be empty when using default associations or contains both an `associationCategory` and `associationTypeId` for custom or named association labels. Most `HUBSPOT_DEFINED` associations can be found in the [API Documentation](https://developers.hubspot.com/docs/api/crm/associations). `USER_DEFINED` associations type ids can be easily found by editing the association and looking in the URL. When editing the association the URL will be in the following format: `https://app.hubspot.com/association-settings/[portalId]/edit-association-label/[associationTypeId]`.

### TARGETOBJECT
A String that should contain an internal object id or fully qualified object name. For native objects you can use `contact`, `company`, `deal`, `ticket`, etc. Custom object names are displayed when editing the custom object. Fully qualfied custom object names are in the following format: `p[portalId]_internal_name`. See the [API Documentation](https://developers.hubspot.com/docs/api/crm/crm-custom-objects) for more information.

### TARGETPROPERTY
A String that should contain the internal property name on the target object that you want to match on.

### ERRORS
An Object that can be used to determine when and if you wish you throw errors under the following conditions.
#### Not Found
If set to true, the workflow action will error when no matching records are found.
#### Multiple
If set to true, the workflow will error when more than one matching record is found. If set to false, all matching records will be associated to the enrolled record.

### LOGGING
A boolean value indicating if you wish to log debugging messages.
