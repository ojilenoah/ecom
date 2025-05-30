#!/bin/bash

echo "Adding missing settings to your SoftShop database..."

# Create the complete settings object with all required fields
curl -X PUT http://localhost:5000/api/admin/settings \
  -H "Content-Type: application/json" \
  -d '{
    "platform_name": "SoftShop",
    "maintenance_mode": "false",
    "allow_new_vendors": "true",
    "email_verification_required": "false",
    "allow_user_registration": "true",
    "require_vendor_approval": "true",
    "platform_commission": "5",
    "minimum_order_amount": "10.00",
    "smtp_host": "smtp.gmail.com",
    "smtp_port": "587",
    "from_email": "noreply@softshop.com",
    "smtp_username": "",
    "smtp_password": "",
    "max_upload_size": "10485760",
    "default_currency": "USD",
    "tax_rate": "8.5",
    "shipping_fee": "5.00",
    "free_shipping_threshold": "50.00"
  }'

echo -e "\n\nVerifying settings were added..."

# Verify the settings were added
curl -s http://localhost:5000/api/admin/settings | python3 -m json.tool

echo -e "\n✅ Settings update complete!"