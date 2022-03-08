## 1. AWS Configure - Configure Machine AWS Authentication

https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html#cli-configure-quickstart-creds

```
$ aws configure
AWS Access Key ID [None]: AKIAVKR6IJCBY6QZ7YMU
AWS Secret Access Key [None]: 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
Default region name [None]: us-east-1
Default output format [None]: json
```

## 2. AWS Login - Pull and Login to AWS Container Registry

```
$ npm run aws:login
```

## 3. AWS Build - Build Docker and Push to Container Repository

```
$ npm run aws:build
```
