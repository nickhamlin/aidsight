# Deploying the site to EC2

### Provision your EC2 instance
I used a single m3.large spot instance (hourly rate about $0.03) and the spot-instance
friendly Ubuntu Server 14.04 AMI (ami-fce3c696 ubuntu/images/hvm-ssd/ubuntu-trusty-14.04-amd64-server-20160114.5)

Make sure that your security group allows SSH access on port 22 and HTTP access on port 80
You can set up this security group once and recycle it for any future instances.

### Connect to the box
Ensure your private key file and the public DNS for your instance are both available. Use the following to SSH to the machine

`ssh -i "<KEY_PAIR>" ubuntu@ec2-XX-XX-XXX-XXX.compute-1.amazonaws.com`

Once you've SSHed in, just run the following commands in order.

### Install stuff
~~~~
sudo apt-get update
sudo apt-get install apache2 libapache2-mod-wsgi
sudo apt-get install git
sudo apt-get install python-pip
sudo -H pip install boto numpy pandas pymongo flask flask_wtf
~~~~

### Clone the repo
~~~~
cd /var/www
sudo git clone https://github.com/nickhamlin/mids_capstone.git
~~~~

### Start the Server
Move the config file to the right place, replace the default apache site with ours,
then restart everything fresh.
~~~~
sudo cp app/aidsight.conf /etc/apache2/sites-available/aidsight.conf
sudo a2dissite 000-default.conf
sudo a2ensite aidsight.conf
sudo /etc/init.d/apache2 restart
~~~~

Once this is done, enter the instance's public DNS name into a browser to see the site!

### References
http://blog.garethdwyer.co.za/2013/07/getting-simple-flask-app-running-on.html
