#!/bin/sh

file_name="luci-app-droidnet_1.1_all.ipk"
version="v1.1"

echo "Updating OPKG"
opkg update
echo "Installing curl"
opkg install curl
echo "Downloading $file_name"
curl -LO "https://github.com/animegasan/luci-app-droidnet/releases/download/$version/$file_name"
echo "Installing $file_name"
opkg install $file_name
echo "Process completed. $file_name has been installed."
