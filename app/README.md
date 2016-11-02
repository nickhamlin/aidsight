# Deploying the site to EC2

### Install Jupyter

### Install MongoDB
Run the notebook on the EC2 instance:

* eda/w210-install-mongodb.ipynb

### Load Data into MongoDB
Run the notebook on the EC2 instance:

* w210-load-data-from-backup-mongodb.ipynb

### Provision your EC2 instance
I used a single m1.large spot instance (hourly rate about $0.03) and the spot-instance
friendly Ubuntu Server 16.04 AMI (ubuntu/images/ebs-ssd/ubuntu-xenial-16.04-amd64-server-20160907.1)

Make sure that your security group allows SSH access on port 22 and HTTP access on port 80
You can set up this security group once and recycle it for any future instances.

### Connect to the box
Ensure your private key file and the public DNS for your instance are both available. Use the following to SSH to the machine

`ssh -i "<KEY_PAIR>" ubuntu@ec2-XX-XX-XXX-XXX.compute-1.amazonaws.com`

Once you've SSHed in, just run the following commands in order.

### Install stuff
~~~~
sudo apt-get update
sudo apt-get install -y apache2 libapache2-mod-wsgi
sudo apt-get install -y git
sudo apt-get install -y python-pip
sudo -H pip install boto numpy pandas pymongo flask flask_wtf requests
~~~~

### Clone the repo
~~~~
cd ~
git clone https://github.com/nickhamlin/aidsight.git

cd /var/www
sudo mkdir -p aidsight
sudo chown ubuntu:ubuntu aidsight

cd aidsight
ln -s /home/ubuntu/aidsight/app
~~~~

### Start the Server
Move the config file to the right place, replace the default apache site with ours,
then restart everything fresh.
~~~~
sudo cp app/aidsight.conf /etc/apache2/sites-available/aidsight.conf
sudo a2dissite 000-default.conf
sudo a2ensite aidsight.conf
sudo service apache2 restart
~~~~

Once this is done, enter the instance's public DNS name into a browser to see the site!

### References
http://blog.garethdwyer.co.za/2013/07/getting-simple-flask-app-running-on.html
