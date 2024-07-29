<div align="center">
  <h1>LuCI support for Android Modem</h1>
  <h3>Manage Android modem and optimize network settings.</h3>
</div>
<hr/>
<div align="center">
  <img alt="License" src="https://img.shields.io/github/license/animegasan/luci-app-droidnet?style=for-the-badge">
  <img alt="Forks" src="https://img.shields.io/github/forks/animegasan/luci-app-droidnet?style=for-the-badge">
  <img alt="Release" src="https://img.shields.io/github/v/release/animegasan/luci-app-droidnet?style=for-the-badge">
  <img alt="Downloads" src="https://img.shields.io/github/downloads/animegasan/luci-app-droidnet/total?style=for-the-badge">
</div>
<br/>
<div align="center">
  <a target="_blank" href="https://saweria.co/animegasan" alt="Saweria"><img src="https://img.shields.io/badge/saweria-donation?style=for-the-badge&logo=adobeindesign&labelColor=black&color=%23FFA401"></a>
  <a target="_blank" href="https://www.paypal.com/paypalme/animegasan" alt="PayPal"><img src="https://img.shields.io/badge/paypal-donation?style=for-the-badge&logo=paypal&labelColor=black&color=%23003087"></a>
  <a target="_blank" href="https://www.buymeacoffee.com/animegasan" alt="BuyMeACoffee"><img src="https://img.shields.io/badge/buy%20me%20a%20coffee-donation?style=for-the-badge&logo=buymeacoffee&labelColor=black&color=%23FFDD00"></a>
</div>
<hr/>

DroidNet is an application designed specifically for managing and optimizing network settings on Android modems. With advanced features, DroidNet allows users to have full control over their network connectivity and modem performance, ensuring a better user experience and more stable connections.

## Install via Terminal
```
curl -s https://raw.githubusercontent.com/animegasan/luci-app-droidnet/master/install.sh | sh
```

## Supported Devices
- Android version 10 or greater
- Rooted Android for version 10 and lower

## Features
### Monitoring Service
Tracks network activity on Android modem, automatically restarts networks including tunnel services such as Neko, OpenClash, Passwall, and V2Ray based on predefined configurations. Supports ping via methods such as HTTP, HTTPS, TCP, and ICMP. Continuous monitoring can maintain optimal network connectivity, reducing risk of disruption and downtime.

### Information Service
Provides comprehensive information about various aspects of Android modem, ensuring access to important details about device performance and connectivity. This includes device details such as model, manufacturer, and operating system version, battery information such as current charge level and battery health, insights about wireless connectivity such as Wi-Fi networks, and information about cellular connectivity such as network provider.
<details><summary>Screenshoot</summary>
 <p>
  <img src="https://github.com/animegasan/luci-app-droidnet/assets/14136053/5a1129a5-1106-4e69-8222-848228e43e6b">
 </p>
</details>

### Mobile Network
Displays IP address of Android modem, status of wireless connection, mobile data, and airplane mode. Ypu can manually enable or disable wireless connection, mobile data, and airplane mode as needed.
<details><summary>Screenshoot</summary>
 <p>
  <img src="https://github.com/animegasan/luci-app-droidnet/assets/14136053/d9451e7a-9117-45b2-8944-9eab5cf97da0">
 </p>
</details>

### Power Options and Application Manager
- Power Options<br>
Gives full control over power operations of Android modem, allowing management of different power modes from one easily accessible place. You can shut down device, restart it, reboot device to enter fastboot mode, and reboot device to enter recovery mode.
- Application Manager<br>
Manage applications installed on Android modem, adding necessary applications to enhance functionality or support specific needs and removing unnecessary applications for optimal device performance.
<details><summary>Screenshoot</summary>
 <p>
  <img src="https://github.com/animegasan/luci-app-droidnet/assets/14136053/8ae4f4e4-1e87-4462-9fb1-11c879bcc4d4">
 </p>
</details>

### Inbox Messages
View all incoming messages received by Android modem, including sender information, message content, and reception date. Useful for monitoring important messages without need for a separate device.
<details><summary>Screenshoot</summary>
 <p>
  <img src="https://github.com/animegasan/luci-app-droidnet/assets/14136053/8816329b-f8eb-47a0-a292-bb6bf8073f4d">
 </p>
</details>
