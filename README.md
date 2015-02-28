# wonderlic/elb-presence

### Links

* github: [https://github.com/wonderlic/docker-elb-presence](https://github.com/wonderlic/docker-elb-presence)
* docker hub: [https://registry.hub.docker.com/u/wonderlic/elb-presence/](https://registry.hub.docker.com/u/wonderlic/elb-presence/)

### Description

This docker image will register an Amazon EC2 Instance with an Amazon Elastic Load Balancer (ELB).
It will then wait for a SIGINT or SIGTERM signal, at which point it will deregister the EC2 instance from the ELB.

### Docker Image Size

```
wonderlic/elb-presence:latest  - ? MB
```

### Usage

```
docker run \
  -e AWS_ACCESS_KEY_ID=... \
  -e AWS_SECRET_ACCESS_KEY=... \
  -e AWS_DEFAULT_REGION=... \
  -e ELB_NAME=... \
  -e INSTANCE_ID=... \
  wonderlic/elb-presence
```

INSTANCE_ID is optional.  If not supplied, the code will attempt to look up the instance-id of the Amazon EC2 instance that it is running on using the local meta-data service.
