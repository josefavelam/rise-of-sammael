#!/bin/bash
# Sprite generation helper - downloads completed predictions
# Usage: ./generate-sprites.sh <prediction_id> <output_path>

PRED_ID="$1"
OUTPUT="$2"

if [ -z "$PRED_ID" ] || [ -z "$OUTPUT" ]; then
  echo "Usage: $0 <prediction_id> <output_path>"
  exit 1
fi

# Poll for completion (max 60s)
for i in $(seq 1 30); do
  STATUS=$(curl -s -H "Authorization: Bearer $(cat /tmp/replicate_token 2>/dev/null)" \
    "https://api.replicate.com/v1/predictions/$PRED_ID" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('status','unknown'))
")
  if [ "$STATUS" = "succeeded" ]; then
    URL=$(curl -s -H "Authorization: Bearer $(cat /tmp/replicate_token 2>/dev/null)" \
      "https://api.replicate.com/v1/predictions/$PRED_ID" | python3 -c "
import sys, json
d = json.load(sys.stdin)
out = d.get('output','')
if isinstance(out, list): print(out[0])
elif isinstance(out, str): print(out)
else: print('')
")
    curl -sL "$URL" -o "$OUTPUT"
    echo "Downloaded to $OUTPUT"
    exit 0
  elif [ "$STATUS" = "failed" ] || [ "$STATUS" = "canceled" ]; then
    echo "Prediction $STATUS"
    exit 1
  fi
  sleep 2
done
echo "Timeout waiting for prediction"
exit 1
