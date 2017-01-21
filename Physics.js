'use strict';

function Physics(ground_v, options) {
    this.obj_list = [];
    this.gravity = vector.make(0.0, -0.00981, 0.0);
    this.ground_vector = ground_v;
    this.options = options;
}

Physics.prototype.add_object = function (obj) {
    this.obj_list[this.obj_list.length] = obj;
    obj.velocity = vector.make(0, 0, 0);
};

Physics.prototype.apply_forces = function () {
    for (var i = 0; i < this.obj_list.length; i++) {
        var obj = this.obj_list[i];
        obj.c = vector.add(obj.c, obj.velocity);
        obj.velocity = vector.add(obj.velocity, this.gravity);

        var y_lowest_point = obj.c[1] - obj.r;
        if (y_lowest_point <= this.ground_vector[1]) {

            if (this.options.bouncing) {
                // bounce the sphere by reversing the velocity and adding some damping
                obj.c[1] -= y_lowest_point - this.ground_vector[1];
                obj.velocity[0] *= 0.9;
                obj.velocity[1] *= -0.6;
                obj.velocity[2] *= 0.9;
            } else {
                // no bouncing
                obj.velocity[1] = 0;
                obj.c[1] = obj.r;
            }
        }

    }
};


