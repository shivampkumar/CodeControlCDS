import json
import pandas as pd
import csv

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
 
