#!/bin/sh

mv /root/app /etc/init.d
chmod 755 /etc/init.d/app
/etc/init.d/app enable
/etc/init.d/app enabled && echo 'install success! please reboot MPU.'
