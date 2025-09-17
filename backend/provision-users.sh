#!/usr/bin/env bash
set -euo pipefail

API="https://tracking.riuman.com/api"
ADMIN_EMAIL="admin@webwork.dev"
ADMIN_PASSWORD="Password123!"
DEFAULT_PASSWORD="@Riuman786!!!"

# get admin token
TOKEN=$(curl -s "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" | jq -r '.data.token')

[[ -z "$TOKEN" || "$TOKEN" == "null" ]] && { echo "Failed to get admin token"; exit 1; }

create_user() {
  local name="$1"
  local slug=$(echo "$name" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-')
  local email="${slug}@riuman.com"
  curl -s "$API/users" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"firstName\":\"${name%% *}\",\"lastName\":\"${name#* }\",
         \"email\":\"$email\",\"password\":\"$DEFAULT_PASSWORD\",\"role\":\"employee\"}" \
    | jq .
  echo "$email"
}

assign_task() {
  local userId="$1"
  curl -s "$API/tasks" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"Default Task\",\"description\":\"Kick-off task\",\"status\":\"todo\",
         \"assigneeId\":\"$userId\"}" | jq .
}

# Example list – replace or expand as needed
users=(
  "Khadija CL1"
  "Sidra CL1"
  "Junaid Ghouri CL1"
  # ...
)

for fullName in "${users[@]}"; do
  email=$(create_user "$fullName")
  userId=$(curl -s "$API/users?search=$email" \
            -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].id // .users[0].id')
  [[ -n "$userId" && "$userId" != "null" ]] && assign_task "$userId"
done
