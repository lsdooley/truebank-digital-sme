// AWS / infrastructure synthetic data — EKS, CloudTrail, Config, tagging

export const awsCmdbChunks = [

  {
    id: 'aws_eks_001',
    appid: 'APPID-973193',
    source: 'aws_infrastructure',
    source_label: 'AWS/CMDB',
    record_id: 'EKS-PROD-TRUEVIEW-01',
    title: 'EKS cluster topology — prod-eks-trueview-01',
    text: `AWS RESOURCE: EKS Cluster
Resource ID: prod-eks-trueview-01
Region: us-east-1
Account: 512492730598
Kubernetes version: 1.29
Status: ACTIVE
Last Updated: 2025-03-04T09:45:00Z

NODE GROUPS:
1. truview-core-processing
   Instance type: t3.2xlarge (8 vCPU, 32GB) — upgraded from t3.xlarge via CHG0103981
   Desired capacity: 5 | Min: 3 | Max: 10
   Current node count: 5 (all Ready)
   Available capacity: ~28% CPU headroom, ~35% memory headroom
   AMI: amazon-eks-node-1.29-v20250201
   Workloads: account-service (3 pods), transaction-service (3 pods), event-router (2 pods), acct-sync-processor (5 pods), transaction-sync-consumer (2 pods)

2. truview-core-general
   Instance type: t3.large (2 vCPU, 8GB)
   Desired capacity: 4 | Min: 2 | Max: 8
   Current node count: 4 (all Ready)
   Available capacity: ~40% CPU headroom, ~30% memory headroom
   Workloads: auth-adapter (2 pods), api-gateway-bridge (2 pods), notification-service (2 pods), legacy-dda-adapter (2 pods)

CLUSTER METRICS (2025-03-04T10:00:00Z):
- Total pods running: 25/25
- Cluster CPU utilisation: 58% (elevated vs baseline 44% — due to INC0089341 extra replicas)
- Cluster memory utilisation: 72% (elevated — acct-sync-processor scale-out to 5 replicas)
- Node ready: 9/9

NETWORKING:
- VPC: vpc-0a1b2c3d4e5f67890 (10.0.0.0/16)
- Subnets: private subnets in us-east-1a, us-east-1b, us-east-1c
- Security group: sg-truview-core-eks (allows inbound 443 from Mule API Gateway)
- Load balancer: prod-alb-truview-core (Application Load Balancer, internal)

ASSOCIATED AWS RESOURCES:
- RDS: prod-rds-truview-core-01 (PostgreSQL 15.4, db.r6g.2xlarge, Multi-AZ)
- ElastiCache: prod-redis-truview-01 (Redis 7.0, r6g.large, 2 nodes)
- MSK: prod-kafka-trueview (Kafka 3.5, 6 brokers, msk.m5.xlarge)
- AWS Glue Schema Registry: trueview-schema-registry`,
    tags: ['aws', 'eks', 'infrastructure', 'truview-core', 'kubernetes', 'node-group', 'capacity', 'topology'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T09:45:00Z',
    ingest_ts: '2025-03-04T09:47:00Z',
    ttl_hours: 2,
    meta: { resource_type: 'EKS Cluster', region: 'us-east-1', node_count: 9 }
  },

  {
    id: 'aws_cloudtrail_001',
    appid: 'APPID-973193',
    source: 'aws_cloudtrail',
    source_label: 'AWS/CMDB',
    record_id: 'CLOUDTRAIL-TRUEVIEW-72H',
    title: 'AWS CloudTrail — TruView relevant events last 72 hours',
    text: `AWS CLOUDTRAIL EVENTS: TruView Platform (last 72 hours)
Source: CloudTrail — us-east-1
Period: 2025-03-01T10:00:00Z to 2025-03-04T10:00:00Z
Filtered for: TruView resource ARNs (EKS, RDS, MSK, ElastiCache, S3 truview-*)

SIGNIFICANT EVENTS:

1. 2025-03-04T03:15:00Z — EKS: UpdateNodegroupConfig
   Resource: truview-core-processing node group
   Actor: truview-cd-bot (IAM role: truview-deploy-role)
   Detail: Rolling update of acct-sync-processor (memory limit change)
   Source IP: 10.0.12.45 (internal, CI/CD runner)
   Status: SUCCESS
   Change record: CHG0104892

2. 2025-03-04T01:22:00Z — Security Group: AuthorizeSecurityGroupIngress
   Resource: sg-0f4b8c3a1d2e9f7b6 (truview-core-eks)
   Actor: platform-infra-bot (IAM role: truview-infra-role)
   Detail: Added inbound rule: TCP 9092 from sg-mule-apigw (Kafka listener access for Mule)
   Source IP: 10.0.15.11 (internal)
   Status: SUCCESS
   REVIEW NOTE: This security group change was flagged by AWS Config for review. Confirmed APPROVED — Mule API Gateway required Kafka direct access for audit log forwarding (approved via internal ticket INF-4421, 2025-03-03T15:00:00Z). Not a security concern.

3. 2025-03-02T22:00:00Z — RDS: ModifyDBParameterGroup
   Resource: prod-rds-truview-core-01-pg (DB parameter group)
   Actor: platform-eng-bot (IAM role: truview-dba-role)
   Detail: max_connections changed from 500 to 800; work_mem changed from 4MB to 8MB
   Status: SUCCESS
   Context: Capacity planning change for PRB0012441 (connection pool exhaustion investigation)

4. 2025-02-25T19:00:00Z — EKS: UpdateNodegroup
   Resource: truview-core-processing node group
   Actor: truview-cd-bot
   Detail: Instance type change t3.xlarge → t3.2xlarge
   Status: SUCCESS
   Change record: CHG0103981

5. 2025-02-25T18:55:00Z — EKS: CreateLaunchTemplateVersion
   Resource: lt-0truview-core-processing-v12
   Actor: truview-cd-bot
   Detail: New launch template version for t3.2xlarge node group
   Status: SUCCESS`,
    tags: ['aws', 'cloudtrail', 'truview-core', 'security-group', 'eks', 'rds', 'audit', 'infrastructure-changes'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T09:45:00Z',
    ingest_ts: '2025-03-04T09:47:00Z',
    ttl_hours: 2,
    meta: { period_hours: 72, event_count: 5 }
  },

  {
    id: 'aws_config_001',
    appid: 'APPID-973193',
    source: 'aws_config',
    source_label: 'AWS/CMDB',
    record_id: 'CONFIG-COMPLIANCE-TRUVIEW',
    title: 'AWS Config compliance — TruView resources',
    text: `AWS CONFIG COMPLIANCE REPORT: TruView Platform
Report Generated: 2025-03-04T09:45:00Z
Scope: TruView tagged resources (tag: Application=TruView*)
Account: 512492730598 (us-east-1)

COMPLIANCE SUMMARY:
- Total resources evaluated: 47
- Compliant: 46
- Non-compliant: 1
- Not applicable: 0
Overall compliance: 97.9%

NON-COMPLIANT RESOURCE:
Resource: prod-rds-truview-core-01
Resource Type: AWS::RDS::DBInstance
Rule violated: required-tags (TRUEBANK-TAG-POLICY-v2)
Missing tag: CostCenter
Required value: cost center code (format: CC-XXXX)
Severity: LOW (non-critical; tracked in backlog)
Backlog ticket: INFRA-8821 (Platform Engineering backlog, unassigned)
Notes: All other required tags present: Application=TruView-Core, Environment=prod, Owner=platform-engineering, DataClassification=Restricted. CostCenter tag was missed during the original RDS provisioning and has not been remediated. No operational impact.

COMPLIANT RULES (sample):
- s3-bucket-ssl-requests-only: truview-web-static, truview-mobile-assets, truview-core-audit-logs — COMPLIANT
- rds-multi-az-support: prod-rds-truview-core-01 — COMPLIANT (Multi-AZ enabled)
- encrypted-volumes: all EKS node volumes — COMPLIANT (encrypted with KMS key alias/truview-eks)
- restricted-ssh: all truview security groups — COMPLIANT (no SSH 22 open to 0.0.0.0/0)
- cloudtrail-enabled: us-east-1 — COMPLIANT
- guardduty-enabled: us-east-1 — COMPLIANT`,
    tags: ['aws', 'config', 'compliance', 'truview-core', 'rds', 'tags', 'security'],
    classification: 'INTERNAL',
    freshness_ts: '2025-03-04T09:45:00Z',
    ingest_ts: '2025-03-04T09:47:00Z',
    ttl_hours: 4,
    meta: { compliance_rate: '97.9%', non_compliant_count: 1 }
  },

];
