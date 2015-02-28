var AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_DEFAULT_REGION
});

var elb = new AWS.ELB();
var metadata = new AWS.MetadataService();

var elbName = process.env.ELB_NAME;
var instanceId = process.env.INSTANCE_ID || null;  // Read this from the metadata service if not passed in

function _getInstanceId(cb) {
  metadata.request('/latest/meta-data/instance-id', function(err, data) {
    if (err) { return cb(err); }
    console.log('Running on instance ' + data);
    cb(null, data);
  });
}

function _deregisterInstance(cb) {
  console.log('Deregistering instance ' + instanceId + ' from load balancer ' + elbName + ' ...');
  elb.deregisterInstancesFromLoadBalancer({Instances: [{InstanceId: instanceId}], LoadBalancerName: elbName}, function(err, data) {
    if (err) { return cb(err); }
    _waitForDeregistration(cb);
  });
}

function _isInstanceIdInArray(instances, instanceId) {
  if (instances && instances.length > 0) {
    for (var i = 0; i < instances.length; i++) {
      if (instances[i].InstanceId === instanceId) {
        return true;
      }
    }
  }
  return false;
}

function _waitForDeregistration(cb) {
  elb.describeLoadBalancers({LoadBalancerNames: [elbName]}, function(err, data) {
    if (err) { return cb(err); }
    var lb = data.LoadBalancerDescriptions[0];
    if (_isInstanceIdInArray(lb.Instances, instanceId)) {
      console.log('...waiting for deregistration...');
      setTimeout(function() { _waitForDeregistration(cb); }, 1000);
    } else {
      console.log('Instance ' + instanceId + ' successfully deregistered');
      cb();
    }
  });
}

function _registerInstance(cb) {
  console.log('Registering instance ' + instanceId + ' to load balancer ' + elbName + ' ...');
  elb.registerInstancesWithLoadBalancer({Instances: [{InstanceId: instanceId}], LoadBalancerName: elbName}, function(err, data) {
    if (err) { return cb(err); }
    _waitForRegistration(cb);
  });
}

function _waitForRegistration(cb) {
  elb.describeLoadBalancers({LoadBalancerNames: [elbName]}, function(err, data) {
    if (err) { return cb(err); }
    var lb = data.LoadBalancerDescriptions[0];
    if (!_isInstanceIdInArray(lb.Instances, instanceId)) {
      console.log('...waiting for registration...');
      setTimeout(function() { _waitForRegistration(cb); }, 1000);
    } else {
      console.log('Instance ' + instanceId + ' successfully Registered');
      cb();
    }
  });
}

function _waitForever() {
  setTimeout(function() { _waitForever(); }, 100000);
}

function _handleError(err) {
  console.error(err);
  process.exit(1);
}

var _exitInProgress = false;

function _exitProcess() {
  if (!_exitInProgress) {
    _exitInProgress = true;
    _deregisterInstance(function(err) {
      if (err) {return _handleError(err); }
      process.exit(0);
    });
  }
}

process.on('SIGINT', function() {
  console.log('Received SIGINT. Exiting...');
  _exitProcess();
});

process.on('SIGTERM', function() {
  console.log('Received SIGTERM. Exiting...');
  _exitProcess();
});

// Main processing logic...

function _start() {
  _deregisterInstance(function(err) {
    if (err) {return _handleError(err); }

    _registerInstance(function(err) {
      if (err) {return _handleError(err); }

      _waitForever();
    })
  });
}

if (instanceId) {
  _start();
} else {
  _getInstanceId(function(err, data) {
    if (err) {return _handleError(err);}
    instanceId = data;
    _start();
  });
}
