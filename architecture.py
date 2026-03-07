"""
TrueBank Digital SME — Architecture Diagram
Run: python3.13 architecture.py
Output: architecture.png
"""

from diagrams import Diagram, Cluster, Edge
from diagrams.aws.network import CloudFront, APIGateway
from diagrams.aws.compute import Lambda
from diagrams.aws.storage import S3
from diagrams.onprem.client import User
from diagrams.onprem.database import Mongodb
from diagrams.onprem.monitoring import Grafana
from diagrams.programming.framework import React
from diagrams.saas.alerting import Pagerduty
from diagrams.generic.storage import Storage

graph_attr = {
    "fontsize": "22",
    "bgcolor": "white",
    "pad": "0.6",
    "splines": "ortho",
    "rankdir": "LR",
}

with Diagram(
    "TrueBank Digital SME — RAG Architecture",
    filename="architecture",
    outformat="png",
    show=False,
    graph_attr=graph_attr,
):
    user = User("Browser\n/ User")

    with Cluster("AWS  us-east-1"):

        cdn = CloudFront("CloudFront\nCDN")

        with Cluster("Frontend"):
            s3 = S3("S3 Bucket\nstatic assets")
            spa = React("React + Vite SPA\n(Chat UI, Context Panel,\nSidebar, Freshness Bar)")
            s3 - spa

        with Cluster("Backend"):
            apigw = APIGateway("HTTP API Gateway\n/api/*")
            fn = Lambda("Lambda\ntruebank-sme-api\nNode.js 20 · 512MB · 30s")

            with Cluster("RAG Pipeline (in Lambda)"):
                retrieval = Storage("Retrieval Engine\ntokenize · stem · score\nintent detect (CVE / Policy)")

                with Cluster("In-Memory Knowledge Base"):
                    sn   = Mongodb("ServiceNow\nIncidents · Changes")
                    conf = Mongodb("Confluence\nDocs · Runbooks")
                    dyna = Grafana("Dynatrace\nAlerts · Metrics")
                    cicd = Storage("CI/CD\nPipeline Records")
                    cmdb = Storage("AWS/CMDB\nInfrastructure")
                    adr  = Storage("Architecture / ADR")
                    onb  = Storage("Onboarding\nGuides")
                    cve  = Storage("CVE · Policy\nSecurity Records")

                kb_nodes = [sn, conf, dyna, cicd, cmdb, adr, onb, cve]
                for node in kb_nodes:
                    node >> Edge(style="dashed", color="gray") >> retrieval

            retrieval >> Edge(label="top-k chunks") >> fn

    external = Pagerduty("Anthropic API\nClaude Haiku 4.5")

    # Main request flow
    user >> Edge(label="HTTPS") >> cdn
    cdn >> Edge(label="static\nassets") >> s3
    cdn >> Edge(label="/api/*\nproxy") >> apigw
    apigw >> fn
    fn >> Edge(label="query +\nchunks") >> external
    external >> Edge(label="streamed\nresponse") >> fn

print("✅  Diagram saved to architecture.png")
