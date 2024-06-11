#!/bin/sh

# This is free software, licensed under the Apache License, Version 2.0
#
# Copyright (C) 2024 Hilman Maulana <hilman0.0maulana@gmail.com>

file_name="luci-app-droidnet_1.2_all.ipk"
version="v1.2"

echo "Updating OPKG"
opkg update
echo "Installing curl"
opkg install curl
echo "Downloading $file_name"
curl -LO "https://github.com/animegasan/luci-app-droidnet/releases/download/$version/$file_name"
echo "Installing $file_name"
opkg install $file_name
echo "Process completed. $file_name has been installed."
