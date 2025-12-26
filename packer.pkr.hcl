packer {
  required_plugins {
    amazon = {
      version = ">= 1.0.0"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "source_ami" {
  type    = string
  default = "ami-0e2c8caa4b6378d8c"
}


variable "ssh_username" {
  type    = string
  default = "ubuntu"
}

variable "instance_type" {
  type    = string
  default = "t2.micro"
}

variable "ami_name_prefix" {
  type    = string
  default = "csye6225-webapp"
}

variable "demo_account_id" {
  type    = string
  default = ""
}

source "amazon-ebs" "webapp" {
  region          = var.aws_region
  ami_name        = "${var.ami_name_prefix}-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  ami_description = "Custom AMI for CSYE6225 Web Application"
  instance_type   = var.instance_type
  source_ami      = var.source_ami
  ssh_username    = var.ssh_username

  ami_users = var.demo_account_id != "" ? [var.demo_account_id] : []

  launch_block_device_mappings {
    device_name           = "/dev/sda1"
    volume_size           = 25
    volume_type           = "gp2"
    delete_on_termination = true
  }

  tags = {
    Name        = "${var.ami_name_prefix}-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
    Environment = "development"
    Application = "webapp"
  }
}

build {
  sources = ["source.amazon-ebs.webapp"]

  provisioner "shell" {
    inline = [
      "echo 'Updating system packages...'",
      "sudo apt-get update",
      "sudo apt-get upgrade -y"
    ]
  }

  provisioner "shell" {
    inline = [
      "echo 'Installing Node.js 22.x...'",
      "curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -",
      "sudo apt-get install -y nodejs",
      "node --version",
      "npm --version"
    ]
  }

  provisioner "shell" {
    inline = [
      "echo 'Installing PostgreSQL 14...'",
      "sudo sh -c 'echo \"deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main\" > /etc/apt/sources.list.d/pgdg.list'",
      "wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -",
      "sudo apt-get update",
      "sudo apt-get install -y postgresql-14 postgresql-contrib-14",
      "sudo systemctl enable postgresql",
      "sudo systemctl start postgresql"
    ]
  }

  provisioner "shell" {
    inline = [
      "echo 'Creating csye6225 user and group...'",
      "sudo groupadd csye6225",
      "sudo useradd -r -g csye6225 -s /usr/sbin/nologin csye6225",
      "echo 'User csye6225 created successfully'",
      "id csye6225"
    ]
  }

  provisioner "shell" {
    inline = [
      "echo 'Creating application directory...'",
      "sudo mkdir -p /opt/webapp",
      "sudo chown csye6225:csye6225 /opt/webapp"
    ]
  }

  provisioner "file" {
    source      = "webapp.zip"
    destination = "/tmp/webapp.zip"
  }

  provisioner "shell" {
    inline = [
      "echo 'Setting up application...'",
      "sudo apt-get install -y unzip",
      "sudo unzip /tmp/webapp.zip -d /opt/webapp",
      "sudo chown -R csye6225:csye6225 /opt/webapp",
      "cd /opt/webapp",
      "sudo -u csye6225 npm ci --production"
    ]
  }

  provisioner "shell" {
    inline = [
      "echo 'Creating .env file...'",
      "sudo tee /opt/webapp/.env > /dev/null <<EOF",
      "DB_HOST=localhost",
      "DB_PORT=5432",
      "DB_NAME=health_check_db",
      "DB_USER=postgres",
      "DB_PASSWORD=",
      "APP_PORT=8080",
      "NODE_ENV=production",
      "EOF",
      "sudo chown csye6225:csye6225 /opt/webapp/.env",
      "sudo chmod 600 /opt/webapp/.env"
    ]
  }

  provisioner "shell" {
    inline = [
      "echo 'Setting up PostgreSQL database...'",
      "sudo -u postgres psql -c \"CREATE DATABASE health_check_db;\"",
      "sudo -u postgres psql -c \"CREATE USER csye6225_db WITH PASSWORD 'csye6225pass';\"",
      "sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE health_check_db TO csye6225_db;\"",
      "echo 'Database setup complete'"
    ]
  }

  provisioner "file" {
    source      = "webapp.service"
    destination = "/tmp/webapp.service"
  }

  provisioner "shell" {
    inline = [
      "echo 'Setting up systemd service...'",
      "sudo mv /tmp/webapp.service /etc/systemd/system/webapp.service",
      "sudo systemctl daemon-reload",
      "sudo systemctl enable webapp.service",
      "echo 'Systemd service configured successfully'"
    ]
  }

  provisioner "shell" {
    inline = [
      "echo 'Cleaning up...'",
      "sudo rm -f /tmp/webapp.zip",
      "sudo apt-get clean",
      "sudo apt-get autoremove -y"
    ]
  }
}