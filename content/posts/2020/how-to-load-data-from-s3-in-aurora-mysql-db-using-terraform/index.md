+++
title = "How to load data from S3 in Aurora MySQL DB using Terraform?"
slug = 'how-to-load-data-from-s3-in-aurora-mysql-db-using-terraform'
aliases = ['/post/how-to-load-data-from-s3-in-aurora-mysql-db-using-terraform']
date = '2020-06-10T14:03:50.000Z'
draft = false
tags = ["aws","terraform","mysql","infrastructure","devops"]
image = 'featured.jpg'
+++

At work, I needed to import lot of data in a MySQL database, instead of importing from a VPS or a local machine I decided to use S3 storage (that is also way cheaper to keep temporary data). In this tutorial, I will show you how to create the AWS infrastructure to import from S3 to RDS (Aurora) MySQL using Terraform.  
 

This tutorial assume that you previously created an AWS RDS cluster and an instance in it. Also you added your cluster in a custom parameter group. Finally, don't forget to rename the different resources as I chose generic names.  
  
  
First step is to create a S3 bucket, I will not cover here how to configure ACL for your bucket (but I highly recommend to deny public access to it).

```javascript
resource "aws_s3_bucket" "my_bucket" {
  bucket = "bucket.domain.com"
}
```

  
Then, you need to add an attached policy to authorize the AWS account you need to the S3 bucket:

```javascript
resource "aws_s3_bucket_policy" "my_bucket" {
  bucket = aws_s3_bucket.my_bucket.id
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
          "AWS": "arn:aws:iam::1234567890:root"
      },
      "Action": "s3:*",
      "Resource": "${aws_s3_bucket.my_bucket.arn}/*"
    }
  ]
}
EOF
}
```

  
Next, you have to create an IAM policy that will grant Aurora MySQL permissions to access the S3 bucket. Following [this AWS documentation](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/AuroraMySQL.Integrating.Authorizing.IAM.S3CreatePolicy.html) we need to give "ListBucket", "GetObject" and "GetObjectVersion" rights.

```javascript
resource "aws_iam_policy" "rds_database" {
  name   = "rds-database-policy"
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:GetObjectVersion"],
      "Resource": "${aws_s3_bucket.my_bucket.arn}/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "${aws_s3_bucket.my_bucket.arn}"
    }
  ]
}
EOF
}
```

  
In order to link this policy we have to create an IAM role and attach it to the previous policy.

```javascript
resource "aws_iam_role" "rds_database" {
  name               = "rds-database-role"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "rds.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
}
 
resource "aws_iam_role_policy_attachment" "rds_database" {
  role       = aws_iam_role.rds_database.name
  policy_arn = aws_iam_policy.rds_database.arn
}
```

  
Then you have to set the role as parameter "aurora\_load\_from\_s3\_role" in your cluster parameter group, for instance:

```javascript
resource "aws_rds_cluster_parameter_group" "mydb" {
  name        = "mydb-aurora-mysql5-7"
  family      = "aurora-mysql5.7"
  description = "RDS cluster parameter group for mydb"
 
  parameter {
    name  = "aurora_load_from_s3_role"
    value = aws_iam_role.rds_database.arn
  }
}
```

  
Finally you can link the created role to your cluster with the following setting:

```
iam_roles = [aws_iam_role.rds_database.arn]
```

  
For the last steps, you will need to connect to a MySQL client (you can use an EC2 instance in the same subnet for example) and execute similar commands:

```sql
use yourdatabase;
 
load data from s3 's3-eu-west-1://bucket.domain.com/yourfile' into table YourTable;
```

Possible parameters for LOAD DATA FROM S3 are available in [this documentation](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/AuroraMySQL.Integrating.LoadFromS3.html#AuroraMySQL.Integrating.LoadFromS3.Text).  
  
 

If you spot an issue in this tutorial or have any question, feel free to use the comments below!
