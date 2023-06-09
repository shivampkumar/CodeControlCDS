const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// This is necessary middleware to parse JSON into the incoming request body for POST requests
app.use(bodyParser.json());

/**
 * Security Considerations:
 * - CDS Services must implement CORS in order to be called from a web browser
 */
app.use((request, response, next) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.setHeader('Access-Control-Expose-Headers', 'Origin, Accept, Content-Location, ' +
    'Location, X-Requested-With');

  // Pass to next layer of middleware
  next();
});

/**
 * Authorization.
 * - CDS Services should only allow calls from trusted CDS Clients
 */
app.use((request, response, next) => {
  // Always allow OPTIONS requests as part of CORS pre-flight support.
  if (request.method === 'OPTIONS') {
    next();
    return;
  }

  const serviceHost = request.get('Host');
  const authorizationHeader = request.get('Authorization') || 'Bearer open'; // Default a token until ready to enable auth.

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer')) {
    response.set('WWW-Authenticate', `Bearer realm="${serviceHost}", error="invalid_token", error_description="No Bearer token provided."`)
    return response.status(401).end();
  }

  const token = authorizationHeader.replace('Bearer ', '');
  const aud = `${request.protocol}://${serviceHost}${request.originalUrl}`;

  const isValid = true; // Verify token validity per https://cds-hooks.org/specification/current/#trusting-cds-clients

  if (!isValid) {
    response.set('WWW-Authenticate', `Bearer realm="${serviceHost}", error="invalid_token", error_description="The token is invalid."`)
    return response.status(401).end();
  }

  // Pass to next layer of middleware
  next();
})

/**
 * Discovery Endpoint:
 * - A GET request to the discovery endpoint, or URL path ending in '/cds-services'
 * - This function should respond with definitions of each CDS Service for this app in JSON format
 * - See details here: https://cds-hooks.org/specification/current/#discovery
 */
app.get('/cds-services', (request, response) => {

  // Example service to invoke the patient-view hook
  const patientViewExample = {
    hook: 'patient-view',
    id: 'patient-view-example',
    title: 'Example patient-view CDS Service',
    description: 'Displays the name of the patient',
    prefetch: {
      // Request the Patient FHIR resource for the patient in context, where the EHR fills out the prefetch template
      // See details here: https://cds-hooks.org/specification/current/#prefetch-template
      requestedPatient: 'Patient/{{context.patientId}}'
    }
  };

  // Example service to invoke the order-select hook
  const orderSelectExample = {
    hook: 'order-select',
    id: 'order-select-example',
    title: 'Example order-select CDS Service',
    description: 'Suggests prescribing Aspirin 81 MG Oral Tablets',
  };

  // Service to predict missing codes
  const missingCodeService = {
    hook: 'patient-view',
    id: 'missing-code',
    title: 'Missing Code Prediction CDS Servicet',
    description: "Suggests Diagnostic Codes which might be missing with a degree of confidence"
  }

  const discoveryEndpointServices = {
    services: [ patientViewExample, orderSelectExample, missingCodeService ]
  };
  response.send(JSON.stringify(discoveryEndpointServices, null, 2));
});

/**
 * Patient View Example Service:
 * - Handles POST requests to our patient-view-example endpoint
 * - This function should respond with an array of card(s) in JSON format for the patient-view hook
 *
 * - Service purpose: Display a patient's first and last name, with a link to the CDS Hooks web page
 */
app.post('/cds-services/patient-view-example', (request, response) => {

  // Parse the request body for the Patient prefetch resource
  const patientResource = request.body.prefetch.requestedPatient;
  console.log(patientResource);
  //let newMedicationRequest = context;
  const conditionCodeCard = {
    cards: [
      {
        summary: 'Following codes are recommended for Patient: 76202c51-1b9d-5cc2-a7bc-3dfb2ac3ab32 after CodeControl',
        indicator: 'warning',
        suggestions: [
          {
            label: 'Add Code: 4271 (Paroxysmal ventricular tachycardia)',
            actions: [
              {
                type: 'create',
                description: 'Adding Code: 4271 (Paroxysmal ventricular tachycardia) to patient Condition', 
                resource: "None"
              }
            ]
          },
          {
            label: 'Add Code: 4241 (Aortic valve disorders)',
            actions: [
              {
                type: 'create',
                description: 'Adding Code: 4241 (Aortic valve disorders', 
                resource: "newMedicationRequest"
              }
            ]
          }
        ],
        source: {
          label: 'CodeControl',
          url: 'https://github.com/cerner/cds-services-tutorial/wiki/Order-Select-Service'
        }
      }
    ]
  }
//   const patientViewCard = {
//     cards: [
//       {
//         // Use the patient's First and Last name
//         summary: 'Now seeing: ' + patientResource.name[0].given[0] + ' ' + patientResource.name[0].family[0],
//         indicator: 'info',
//         source: {
//           label: 'CDS Service Tutorial',
//           url: 'https://github.com/cerner/cds-services-tutorial/wiki/Patient-View-Service'
//         },
//         links: [
//           {
//             label: 'Learn more about CDS Hooks',
//             url: 'https://cds-hooks.org',
//             type: 'absolute'
//           }
//         ]
//       }
//     ]
//   };
  response.send(JSON.stringify(conditionCodeCard, null, 2));
 });


app.post('/cds-services/missing-code', (request, response) => {

  //Write code to get data from context..for now just get data from mongo??
  // let patientData;
  // fetch('./ActuallyPatient.json')
  // .then(response => response.json())
  // .then(data=> {
  //   patientData = data;
  // })
  // .catch(error => {
  //   console.log(error)
  // });
  // console.log(patientData.gender)

  // Check if a medication was chosen by the provider to be ordered
  if (['MedicationRequest', 'MedicationOrder'].includes(draftOrder.resourceType) && selections.includes(`${draftOrder.resourceType}/${draftOrder.id}`)
    && draftOrder.medicationCodeableConcept) {
    const responseCard = createMedicationResponseCard(draftOrder); // see function below for more details
    response.send(JSON.stringify(responseCard, null, 2));
  }
  response.status(200);
});

/**
 * Order Select Example Service:
 * - Handles POST requests to the order-select-example endpoint
 * - This function should respond with an array of cards in JSON format for the order-select hook
 *
 * - Service purpose: Upon a provider choosing a medication to prescribe, display a suggestion for the
 *                    provider to change their chosen medication to the service-recommended Aspirin 81 MG Oral Tablet,
 *                    or display text that affirms the provider is currently prescribing the service-recommended Aspirin
 */
app.post('/cds-services/order-select-example', (request, response) => {

  // Parse the request body for the FHIR context provided by the EHR. In this case, the MedicationRequest/MedicationOrder resource
  const draftOrder = request.body.context.draftOrders.entry[0].resource;
  const selections = request.body.context.selections;

  // Check if a medication was chosen by the provider to be ordered
  if (['MedicationRequest', 'MedicationOrder'].includes(draftOrder.resourceType) && selections.includes(`${draftOrder.resourceType}/${draftOrder.id}`)
    && draftOrder.medicationCodeableConcept) {
    const responseCard = createMedicationResponseCard(draftOrder); // see function below for more details
    response.send(JSON.stringify(responseCard, null, 2));
  }
  response.status(200);
});

/**
 * Creates a Card array based upon the medication chosen by the provider in the request context
 * @param context - The FHIR context of the medication being ordered by the provider
 * @returns {{cards: *[]}} - Either a card with the suggestion to switch medication or a textual info card
 */
function createMedicationResponseCard(context) {
  const providerOrderedMedication = context.medicationCodeableConcept.coding[0].code;

  // Check if medication being ordered is our recommended Aspirin 81 MG Oral Tablet
  if (providerOrderedMedication === '243670') {
    // Return this card if the provider has already chosen this specific medication to prescribe,
    // or the provider has chosen the suggestion to switch to this specific medication already
    return {
      cards: [
        {
          summary: 'Currently prescribing a low-dose Aspirin',
          indicator: 'info',
          source: {
            label: 'CDS Service Tutorial',
            url: 'https://github.com/cerner/cds-services-tutorial/wiki/Order-Select-Service'
          }
        }
      ]
    };
  } else {
    // 1. Copy the current MedicationRequest/MedicationOrder resource the provider intends to prescribe
    // 2. Change the medication being ordered by the provider to our recommended Aspirin 81 MG Oral Tablet
    // 3. Add a suggestion to a card to replace the provider's MedicationRequest/MedicationOrder resource with the CDS Service
    //    copy instead, if the provider clicks on the suggestion button
    let newMedicationRequest = context;
    newMedicationRequest.medicationCodeableConcept = {
      text: 'Aspirin 81 MG Oral Tablet',
      coding: [
        {
          display: 'Aspirin 81 MG Oral Tablet',
          system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
          code: '243670'
        }
      ]
    };

    return {
      cards: [
        {
          summary: 'Reduce cardiovascular risks, prescribe daily 81 MG Aspirin',
          indicator: 'warning',
          suggestions: [
            {
              label: 'Switch to low-dose Aspirin',
              actions: [
                {
                  type: 'create',
                  description: 'Modifying existing medication order to be Aspirin',
                  resource: newMedicationRequest
                }
              ]
            }
          ],
          source: {
            label: 'CDS Service Tutorial',
            url: 'https://github.com/cerner/cds-services-tutorial/wiki/Order-Select-Service'
          }
        }
      ]
    };
  }
}

// Here is where we define the port for the localhost server to setup
app.listen(3000);

//1. encounter_icustays
// identified by "subject": {
      //   "reference": "Patient/76202c51-1b9d-5cc2-a7bc-3dfb2ac3ab32"
      // },

//2. encounter
// "subject": {
//   "reference": "Patient/76202c51-1b9d-5cc2-a7bc-3dfb2ac3ab32"
// },

//3. observation_ce
// to be downloaded

//4. observation_le
//everything has same retrieval

//5. observation_oe

