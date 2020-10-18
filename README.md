## PanElixir - Auto-Update Latest News Division
##### This package uses AWS Lambda Function to scrape data from NYTimes Vaccine Tracker Website and modify the news table in the AWS database

#### The Lambda Function
- This program is a lambda function that updates the Latest News Section
    - Checks Latest News date - if over three days, it will remove the "New" tag
    - Scrapes NYTimes Vaccine Tracker News Section
    - Get data from existing database news_nytimes
    - Drop and modify news_nytimes database
    - Compares existing database and new scraped data
    - Update the news database if there are updates

#### Run Frequency
- This program runs every day at 17:30 and 23:30 UTC under AWS CloudWatch
- cron expression: `30 17/6 * * ? *`

#### Project Structure
```
├── package
│   ├── requests
│   ├── psycopg2
│   └── bs4
│       ├── BeautifulSoup
├── lambda_function.py
├── close_match_indexes.py
├── function.zip
├── ReadMe.md
```
Note: lambda_function.py is a modified version of update_news.py 
in the master branch, several modifications are made to comply with
lambda function requirements

#### To Update Lambda Function in AWS using terminal
1. Install awscli using pip `pip install awscli`
2. Login to AWS in terminal using `aws configure`, the access key ID and password can be found in AWS Credentials. For default region, use `us-west-1`
3. For package modifications - add additional packages to the package folder using `pip install --target ./package [new-package]`
4. Go to the package directory using `cd package`
5. Zip the package folder using ` zip -r9 ${OLDPWD}/function.zip .` (`$OLDPWD` stands for **OLDP**rint**W**orking**D**irectory, which corresponds to the directory before the `cd` command)
6. Go to the main directory `cd $OLDPWD`
7. Zip all necessary files to upload to AWS Lambda `zip -g function.zip lambda_function.py close_match_indexes.py` Remember to include new files here if they are added to the main directory
8. Update AWS Lambda using hte command `aws lambda update-function-code --function-name update_news --zip-file fileb://function.zip`
9. If successful, a JSON string should be returned. <br>
Example: 
```
{
    "FunctionName": "update_news",
    "FunctionArn": "arn:aws:lambda:us-west-1:707744075670:function:update_news",
    "Runtime": "python3.8",
    "Role": "arn:aws:iam::707744075670:role/service-role/update_news-role-l47za4ej",
    "Handler": "lambda_function.lambda_handler",
    "CodeSize": 6586322,
    "Description": "",
    "Timeout": 3,
    "MemorySize": 128,
    "LastModified": "2020-10-18T19:20:54.362+0000",
    "CodeSha256": "Ma2f76lEij0ElcNqO8/rZUgqr4YXL1JBGYL/pz2+T84=",
    "Version": "$LATEST",
    "TracingConfig": {
        "Mode": "PassThrough"
    },
    "RevisionId": "af50c7f2-7c23-493d-97ed-538dcf222a08",
    "State": "Active",
    "LastUpdateStatus": "Successful"
}
```
