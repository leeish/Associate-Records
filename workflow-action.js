const axios = require('axios');

//Action Configuration
const SECRETNAME = 'Bearer_Token'; //Enter the name of your API secret configured in the action setup
const ASSOCIATIONTYPE = { associationCategory: "HUBSPOT_DEFINED", associationTypeId: 279 }; //{ associationCategory, associationTypeId }, Use empty object for default association https://developers.hubspot.com/docs/api/crm/associations
const TARGETOBJECT = 'company'; //Internal name of the object type you want to associate to this object
const TARGETPROPERTY = ''; //Internam name of the property on the object you want to match against
const ERRORS = { 
  notfound: true, //Throw an error if no matching record is found
  multiple: false //Throw an error if more than a single match was found
};
const LOGGING = false; //true/false to show hide debugging messages

exports.main = async (event, callback) => {

  validateSetup(event);

  const targetRecords = await findTargetRecords(Object.values(event.inputFields)[0],event.object.objectId);
  logger('debug',targetRecords);
  
  if(targetRecords.total > 1 && ERRORS.multiple) { throw('More than one match was found.'); }
  if(targetRecords.total == 0 && ERRORS.notfound){ throw('There were no matching records found.'); }

  const response = (targetRecords.total > 0) ? await createBulkAssociations(event.object,targetRecords) : { results: [], numErrors: 0 };

  logger('debug',response);
  
  if(response.numErrors){
    console.log(response);
  }
  
  callback({
    outputFields: {
      matches: targetRecords.total,
      response,
      updated: response.results.length,
      numErrors: response.numErrors,
      error: (response.numErrors) ? true : false
    }
  });

}

function validateSetup(event){
  logger('debug',{secretName: SECRETNAME,targetObject: TARGETOBJECT, targetProperty: TARGETPROPERTY, associationType: ASSOCIATIONTYPE, errors: ERRORS, logLevel: LOGGING });
  
  if(!SECRETNAME) throw('You did not enter a secret name in the action configuration code.');
  if(!process.env[SECRETNAME]) throw('The secret name in the code has not been included in the action configuration.');
  if(!TARGETOBJECT) throw('You did not enter a target object name in the action configuration code.');
  if(!TARGETPROPERTY) throw('You did not enter a target property name in the action configuration code.');
  if(Object.keys(ASSOCIATIONTYPE).length != 0 && Object.keys(ASSOCIATIONTYPE).length != 2) throw('You did not correct define the target association type');
  if(Object.values(event.inputFields).length == 0) throw('You did not define an input property to use for searching');
}

//Allows user to use a Token with or without Bearer in the value
function buildBearerToken(){
  const secret = process.env[SECRETNAME];
  return (secret.search('Bearer') > -1) ? secret : `Bearer ${secret}`;
}

function logger(level,msg){
  if(LOGGING){
    console.log(msg);
  }
}

async function createBulkAssociations(fromObject, targetRecords){
  logger('debug','createBulkAssociations');
  if(Object.keys(ASSOCIATIONTYPE).length == 0) return createBulkDefaultAssociations(fromObject,targetRecords);

  let inputs = targetRecords.results.map(record => {
    return {
      from: { id: fromObject.objectId},
      to: { id: record.id },
      types: [ASSOCIATIONTYPE]
    }
  });
  
  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `https://api.hubapi.com/crm/v4/associations/${fromObject.objectType}/${TARGETOBJECT}/batch/create`,
    headers: { 
      'Accept': 'application/json',
      'Content-Type': 'application/json', 
      'Authorization': buildBearerToken()
    },
    data: { inputs }
  };

  logger('debug',config);
  return (await axios.request(config)).data;
}

async function createBulkDefaultAssociations(fromObject, targetRecords){
  logger('debug','createBulkDefaultAssociations');

  let inputs = targetRecords.results.map(record => {
    return {
      from: { id: fromObject.objectId},
      to: { id: record.id }
    }
  });
  
  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `https://api.hubapi.com/crm/v4/associations/${fromObject.objectType}/${TARGETOBJECT}/batch/associate/default`,
    headers: { 
      'Accept': 'application/json',
      'Content-Type': 'application/json', 
      'Authorization': buildBearerToken()
    },
    data: { inputs }
  };

  logger('debug',config);
  return (await axios.request(config)).data;
}

async function findTargetRecords(targetValue, enrolledObjectId){
  logger('debug','findTargetRecords');
  
  let data = {
    "filterGroups": [
      {
        "filters": [
          {
            "operator": "EQ",
            "propertyName": TARGETPROPERTY,
            "value": targetValue
          },
          {
            "operator": "NEQ",
            "propertyName": "hs_object_id",
            "value": enrolledObjectId
          }
        ]
      }
    ]
  };

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `https://api.hubapi.com/crm/v3/objects/${TARGETOBJECT}/search`,
    headers: { 
      'Content-Type': 'application/json', 
      'Accept': 'application/json',
      'Authorization': buildBearerToken()
    },
    data : data
  };

  logger('debug',config);
  return (await axios.request(config)).data;
}
