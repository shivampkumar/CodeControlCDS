import json
patient = '76202c51-1b9d-5cc2-a7bc-3dfb2ac3ab32' #put patient ID here
patient = 'Patient/' + patient
# open ndjson file
with open('../OGFiles/ObservationChartEvents.ndjson') as f:
    # create empty list to store matching patients
    patients = []
    # iterate over each line in the file
    for line in f:
        # parse the line as a JSON object
        obj = json.loads(line)
        # check if the "reference" field in the "subject" property matches the specific reference
        if obj['subject']['reference'] == patient:
            # add the JSON object to the list of matching patients
            patients.append(obj)

# write the list of matching patients to a new JSON file
with open('./CreatedFiles/ChartEvents.json', 'w') as f:
    json.dump(patients, f)