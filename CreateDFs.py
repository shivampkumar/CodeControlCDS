import json
import pandas as pd
import csv


def addConditions(encounterId, patientID, icuStayId):
    with open('./CreatedFiles/Conditions.json') as f:
        conditionDatas = json.load(f)
    i = 1
    li = []
    for conditionData in conditionDatas:
        if conditionData['encounter']['reference'] == encounterId:
            li.append([patientID,'00000', i, conditionData['code']['coding'][0]['code'], conditionData['code']['coding'][0]['display'], conditionData['code']['coding'][0]['display'], icuStayId] )
            i+=1
    return li

### STEP 1: Get the Patient Details ###
with open('./CreatedFiles/ActuallyPatient.json') as f:
    # Load the JSON data from the file
    data = json.load(f)
    patientID = data['id']
    gender = data['gender']
    dob = data['birthDate']



with open('./CreatedFiles/icuEncounters.json') as f:
    icuDatas = json.load(f)

# Create csv for this #
#SUBJECT_ID	HADM_ID	ICUSTAY_ID	LAST_CAREUNIT	DBSOURCE	INTIME	OUTTIME	LOS	ADMITTIME	DISCHTIME	DEATHTIME	ETHNICITY	DIAGNOSIS	GENDER	DOB	DOD	AGE	MORTALITY_INUNIT	MORTALITY	MORTALITY_INHOSPITAL
stayCsv = [['SUBJECT_ID', 'HADM_ID', 'ICUSTAY_ID', 'LAST_CAREUNIT', 'DBSOURCE', 'INTIME', 'OUTTIME', 'LOS', 'ADMITTIME', 'DISCHTIME','DEATHTIME', 'ETHNICITY', 'DIAGNOSIS','GENDER', 'DOB' ,'DOD', 'AGE', 'MORTALITY_INUNIT','MORTALITY', 'MORTALITY_INHOSPITAL']]

for icuData in icuDatas:
    stayCsv.append([patientID, '00000', icuData['id'], 'UNKNOWN', 'UNKNOWN', icuData['period']['start'],icuData['period']['end'], '0.0', icuData['period']['start'], icuData['period']['end'],'' ,'UNKNOWN/NOT SPECIFIED', 'NA', gender, dob,'' , '50', '0','0','0' ])

with open('stayGen.csv', mode='w', newline='') as f:
    # Create a CSV writer object
    writer = csv.writer(f)
    # Write the data to the file
    writer.writerows(stayCsv)


### STEP 2: Create Diagnoses
dgCsv = [['SUBJECT_ID','HADM_ID', 'SEQ_NUM', 'ICD9_CODE', 'SHORT_TITLE', 'LONG_TITLE', 'ICUSTAY_ID']]

icuData = icuDatas[0] #taking only one icudata
values = addConditions(icuData['partOf']['reference'], patientID, icuData['id'])

dgCsv.extend(values)

with open('diagnoses.csv', mode='w', newline='') as f:
    # Create a CSV writer object
    writer = csv.writer(f)
    # Write the data to the file
    writer.writerows(dgCsv)

### STEP 3: Create Chartevents
#SUBJECT_ID	HADM_ID	ICUSTAY_ID CHARTTIME ITEMID	VALUE VALUEUOM
ceCsv = [['SUBJECT_ID','HADM_ID', 'ICUSTAY_ID', 'CHARTTIME', 'ITEMID', 'VALUE', 'VALUEUOM']]
with open('./CreatedFiles/Chartevents.json') as f:
    charteventDatas = json.load(f)
for charteventData in charteventDatas:
    #check if key valueString exists
    if 'valueString' in charteventData:
        ceCsv.append([patientID, '00000', charteventData['encounter']['reference'].split('/')[1], charteventData['effectiveDateTime'], charteventData['code']['coding'][0]['code'], charteventData['valueString'], ''])
    else:
        ceCsv.append([patientID, '00000', charteventData['encounter']['reference'].split('/')[1], charteventData['effectiveDateTime'], charteventData['code']['coding'][0]['code'], charteventData['valueQuantity']['value'], charteventData['valueQuantity']['unit'] if 'unit' in charteventData['valueQuantity'] else ''])

with open('chartevents.csv', mode='w', newline='') as f:
    # Create a CSV writer object
    writer = csv.writer(f)
    # Write the data to the file
    writer.writerows(ceCsv)
