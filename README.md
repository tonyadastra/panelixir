# PanElixir - Auto-Update USA Distribution Division
> This package uses AWS Lambda Function to collect data from CDC's Vaccine Allocation Data and append to database "VaccineDistributionUSA"

> Data source: [The New York Times Vaccine Tracker](https://www.nytimes.com/interactive/2020/science/coronavirus-vaccine-tracker.html)

## **Divisions and Internal Links**
+ ### [Main Project - Master Branch](https://github.com/tonyliunyc/panelixir/tree/master)
+ ### [Auto-Update NYTimes Division](https://github.com/tonyliunyc/panelixir/tree/AutoUpdateNYTimes)
+ ### [Auto-Update Google Division](https://github.com/tonyliunyc/panelixir/tree/AutoUpdateGoogle)

## Version History
- v1.0 - Initial release 
    + Released: January 8, 2021

## The Lambda Function
- This program is a lambda function that access the CDC Distribution data for Moderna and Pfizer and updates database VaccineDistributionUSA
    - records the data in columns `jurisdiction` and `doses_available`, also has `date` showing the latest update date

## Run Frequency
- This program runs every hour under AWS EventBridge (CloudWatch Events)
- cron expression: `0 * * * ? *`
    + Note: The cron expression AWS uses is quite different from the general cron expression. Check out [AWS Cron Expression Syntax](https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/ScheduledEvents.html) for more details

## Project Structure
```
├── models
│   ├── close_match_indexes.py
│   ├── format_nytimes_intro.py
│   └── nytimes_to_panelixir_style.py
├── package
│   ├── requests
│   ├── psycopg2
│   └── bs4
│       ├── BeautifulSoup
├── getVaccineDistributionUSA.py
├── function.zip
├── return.json
├── .gitignore
├── README.md
```

## Update AWS Lambda Function using Terminal
1. Install awscli using pip 
    + `pip install awscli`
2. Login to AWS in terminal. The access key ID and password can be found in AWS Credentials. For default region, use us-west-1
    + `aws configure`
3. Add additional packages to the package folder if necessary. If no new packages are added, skip to step 7.
    + `pip install --target ./package [new-package]`
4. Go to the package directory
    + `cd package`
5. Zip the package folder (`$OLDPWD` stands for OLDPrintWorkingDirectory, which corresponds to the directory before the `cd` command)
    + `zip -r9 ${OLDPWD}/function.zip .`
6. Return to the main directory
    + `cd $OLDPWD`
7. Zip all necessary files to upload to AWS Lambda. Remember to include new files here if necessary
    + `zip -g function.zip getWorldVaccinations.py models/ -r`
8. Send updates to AWS Lambda
    + `aws lambda update-function-code --function-name getWorldVaccinations --zip-file fileb://function.zip`
9. If successful, a JSON string should be returned.


## Invoke the Lambda Function in Terminal
+ `aws lambda invoke --function-name getVaccineDistributionUSA return.json --log-type Tail --query 'LogResult' --output text |  base64 -d`
+ Execution results will be saved to a file called return.json


## Related Resources
1. [Moderna Distribution Data CDC by Jurisdictions](https://data.cdc.gov/Vaccinations/COVID-19-Vaccine-Distribution-Allocations-by-Juris/b7pe-5nws)
2. [Pfizer Distribution Data CDC by Jurisdictions](https://data.cdc.gov/Vaccinations/COVID-19-Vaccine-Distribution-Allocations-by-Juris/saz5-9hgg)
3. [AWS Lambda Deployment Package](https://docs.aws.amazon.com/lambda/latest/dg/python-package.html)
4. [Psycopg2 Package for AWS Lambda](https://github.com/jkehler/awslambda-psycopg2) (Note: Directly downloading this package using `pip` would cause an error in deployment)
5. [Cron Expression Syntax](https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/ScheduledEvents.html)
6. [AWS Lambda Function Handler](https://docs.aws.amazon.com/lambda/latest/dg/python-handler.html)
