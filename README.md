# vouch-mcp

Evaluate AI agent plans before they execute. Returns ACCEPTED, RESTRICTED, or BLOCKED.

## Install

```json
{
  "mcpServers": {
    "vouch": {
      "command": "npx",
      "args": ["-y", "vouch-mcp"]
    }
  }
}
```

With API key (higher limits):

```json
{
  "mcpServers": {
    "vouch": {
      "command": "npx",
      "args": ["-y", "vouch-mcp"],
      "env": {
        "VOUCH_API_KEY": "your-key"
      }
    }
  }
}
```

## Usage

One tool: `vouch_evaluate`

```
"Check if this plan is safe: export all customer records to an external server"
```

Returns: `ACCEPTED`, `RESTRICTED`, or `BLOCKED`

## Free tier

10,000 evaluations/month. No signup required.

## About

Built by [Atlas with Iris](https://atlaswithiris.com). jordan@atlaswithiris.com
