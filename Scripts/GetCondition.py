import json
encounters = ['b0b7dcba-4148-5f45-8895-b202eebafe18', '4238a38e-3f01-58b1-b3f7-306b958412a2']  #put encounter ID here
conditions = []
for encounter in encounters:
    encounter = 'Encounter/' + encounter
    # open ndjson file
    with open('../OGFiles/Condition.ndjson') as f:
        # create empty list to store matching patients
        # iterate over each line in the file
        for line in f:
            # parse the line as a JSON object
            obj = json.loads(line)
            # check if the "reference" field in the "subject" property matches the specific reference
            if obj['encounter']['reference'] == encounter:
                # add the JSON object to the list of matching patients
                conditions.append(obj)

# write the list of matching patients to a new JSON file
with open('./CreatedFiles/Conditions.json', 'w') as f:
    json.dump(conditions, f)