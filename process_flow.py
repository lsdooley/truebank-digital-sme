"""
TrueBank Digital SME — RAG Process Flow Diagram
Run: python3.13 process_flow.py
Output: process_flow.png
"""

from graphviz import Digraph

dot = Digraph(
    name='RAG Process Flow',
    format='png',
    graph_attr={
        'rankdir':  'TB',
        'bgcolor':  '#0F172A',
        'fontname': 'Helvetica',
        'fontsize': '13',
        'pad':      '0.6',
        'nodesep':  '0.5',
        'ranksep':  '0.55',
        'splines':  'polyline',
    },
    node_attr={
        'fontname': 'Helvetica',
        'fontsize': '12',
        'style':    'filled,rounded',
        'shape':    'box',
        'margin':   '0.25,0.15',
    },
    edge_attr={
        'color':     '#0D9488',
        'penwidth':  '1.8',
        'arrowsize': '0.8',
        'style':     'dashed',
        'fontname':  'Helvetica',
        'fontsize':  '10',
        'fontcolor': '#64748B',
    },
)

# ── Colour palette ────────────────────────────────────────────────────────────
TEAL   = '#0D9488'
AMBER  = '#D97706'
GREEN  = '#16A34A'
PURPLE = '#7C3AED'
BLUE   = '#2563EB'
CARD   = '#1E293B'
BORDER = '#2D3D5A'
TEXT   = '#F1F5F9'
MUTED  = '#94A3B8'

def node(dot, name, label, fillcolor=CARD, fontcolor=TEXT, color=TEAL):
    dot.node(name, label=label, fillcolor=fillcolor, fontcolor=fontcolor, color=color)

def edge(dot, src, dst, label='', color=TEAL):
    dot.edge(src, dst, label=label, color=color)

# ── Nodes ─────────────────────────────────────────────────────────────────────

node(dot, 'query',
     '👤  Engineer Query\n'
     'Natural-language question scoped\n'
     'to an application or All TruView',
     color=TEAL)

node(dot, 'intent',
     '🔍  Intent Detection\n'
     'Tokenise · Stem · Keyword scan\n'
     'Detect: cveIntent  |  policyIntent',
     color=TEAL)

node(dot, 'pool_app',
     '📱  App-Scoped Pool\n'
     'Incidents · Changes · Docs\n'
     'CMDB · Architecture · Onboarding',
     color=TEAL)

node(dot, 'pool_cve',
     '🔐  CVE Pool\n'
     'Security advisories\n'
     'Vulnerability records',
     fillcolor='#1C1035', color=PURPLE, fontcolor=TEXT)

node(dot, 'pool_policy',
     '📋  Policy Pool\n'
     'Compliance & governance\n'
     'Regulatory requirements',
     fillcolor='#0F1E3D', color=BLUE, fontcolor=TEXT)

node(dot, 'retrieval',
     '⚡  Retrieval Engine — Score & Rank\n'
     'Title match +3 · Tag match +2 · Body match +1\n'
     'Phrase match +5 · Scope boost +2 · Recency +1.5\n'
     'Severity boost +2  →  Top-k chunks selected',
     color=TEAL)

node(dot, 'prompt',
     '📝  Prompt Assembly\n'
     'record_id · source · freshness · full text\n'
     'System prompt + user query + context records',
     color=TEAL)

node(dot, 'llm',
     '🤖  Claude Haiku 4.5  ·  Anthropic API\n'
     'Streams grounded response\n'
     'Embeds [SOURCE: record_id] citation markers',
     fillcolor='#1C1200', color=AMBER, fontcolor=TEXT)

node(dot, 'citations',
     '🔗  Citation Extraction\n'
     'Parse [SOURCE: id] markers · Match to chunks\n'
     'Strip markers from visible response text',
     color=TEAL)

node(dot, 'response',
     '💬  Streamed Response\n'
     'Grounded answer delivered\n'
     'token-by-token via SSE',
     fillcolor='#0A1F0F', color=GREEN, fontcolor=TEXT)

node(dot, 'panel',
     '📌  Context Panel\n'
     'Cited source records surfaced\n'
     'Grouped by system · Freshness shown',
     fillcolor='#0A1F0F', color=GREEN, fontcolor=TEXT)

# ── Edges ─────────────────────────────────────────────────────────────────────

edge(dot, 'query',   'intent')
edge(dot, 'intent',  'pool_app',    label='always')
edge(dot, 'intent',  'pool_cve',    label='cveIntent', color=PURPLE)
edge(dot, 'intent',  'pool_policy', label='policyIntent', color=BLUE)
edge(dot, 'pool_app',    'retrieval')
edge(dot, 'pool_cve',    'retrieval', color=PURPLE)
edge(dot, 'pool_policy', 'retrieval', color=BLUE)
edge(dot, 'retrieval', 'prompt')
edge(dot, 'prompt',    'llm')
edge(dot, 'llm',       'citations', color=AMBER)
edge(dot, 'citations', 'response')
edge(dot, 'citations', 'panel')

# ── Rank groupings ────────────────────────────────────────────────────────────
with dot.subgraph() as s:
    s.attr(rank='same')
    s.node('pool_app')
    s.node('pool_cve')
    s.node('pool_policy')

with dot.subgraph() as s:
    s.attr(rank='same')
    s.node('response')
    s.node('panel')

# ── Render ────────────────────────────────────────────────────────────────────
dot.render('process_flow', cleanup=True)
print('✅  Process flow saved to process_flow.png')
