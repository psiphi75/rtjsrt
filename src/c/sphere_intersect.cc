#include <iostream>
#include <math.h>
#include "sphere_intersect.h"

namespace math {

using v8::Exception;
using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Number;
using v8::Object;
using v8::String;
using v8::Value;
using v8::Handle;
using v8::Null;


// .intersect = function (rayDirection, rayOrigin, c, r, col) {
// var A = ray.direction.dot(ray.direction);
// var B = 2.0 * (ray.direction.dot(ray.origin) - ray.direction.dot(c));
// var C = ray.origin.dot(ray.origin) - 2.0 * ray.origin.dot(c) + c.dot(c) - r * r;
// var D = B * B - 4.0 * A * C;
// if (D > 0.0) {
//     var sqrtD = Math.sqrt(D);
//     if (-B - sqrtD > 0) {
//         var t = (-B - sqrtD) / (2.0 * A);
//         var pi = ray.origin.add(ray.direction.scale(t));
//         return {
//             col: col,
//             t: t,
//             pi: pi
//         };
//     }
// }
//
// // No hit, or ray is in wrong direction (when t < zero)
// return null;

Vector unpack_vector(Isolate * isolate, const v8::FunctionCallbackInfo<v8::Value>& args, int argN) {
        Handle<Object> vector_obj = Handle<Object>::Cast(args[argN]);

        float x = vector_obj->Get(String::NewFromUtf8(isolate, "x"))->NumberValue();
        float y = vector_obj->Get(String::NewFromUtf8(isolate, "y"))->NumberValue();
        float z = vector_obj->Get(String::NewFromUtf8(isolate, "z"))->NumberValue();

        Vector v(x, y, z);

        return v;
}

Local<Object> create_obj(Isolate * isolate, Vector v) {

        Local<Object> returnObj = Object::New(isolate);

        returnObj->Set(String::NewFromUtf8(isolate, "x"), Number::New(isolate, v.x));
        returnObj->Set(String::NewFromUtf8(isolate, "y"), Number::New(isolate, v.y));
        returnObj->Set(String::NewFromUtf8(isolate, "z"), Number::New(isolate, v.z));

        return returnObj;
}

// This is the implementation of the "add" method
// Input arguments are passed using the
// const FunctionCallbackInfo<Value>& args struct
void Intersect(const FunctionCallbackInfo<Value>& args) {
        Isolate* isolate = args.GetIsolate();

        // Check the number of arguments passed.
        const int num_args = 5;
        if (args.Length() != num_args) {

            cout << "Expect " << num_args << " arguments, but got " << args.Length() << std::endl;
            // Throw an Error that is passed back to JavaScript
            isolate->ThrowException(Exception::TypeError(
                                            String::NewFromUtf8(isolate, "Wrong number of arguments")));
            return;
        }

        // Check the argument types
        if (!args[0]->IsObject()
            || !args[1]->IsObject()
            || !args[2]->IsObject()
            || !args[3]->IsNumber()
            || !args[4]->IsObject()) {
                isolate->ThrowException(Exception::TypeError(
                                                String::NewFromUtf8(isolate, "Wrong arguments types")));
                return;
        }

        // Perform the operation
        Vector rayDirection = unpack_vector(isolate, args, 0);
        Vector rayOrigin    = unpack_vector(isolate, args, 1);
        Vector sphCentre    = unpack_vector(isolate, args, 2);
        float sphRadius     = args[3]->NumberValue();
        // Vector sphColour    = unpack_vector(isolate, args, 4);

        // std::cout << "rayDirection: " << rayDirection << std::endl;
        // std::cout << "rayOrigin: " << rayOrigin << std::endl;
        // std::cout << "sphCentre: " << sphCentre << std::endl;
        // std::cout << "sphColour: " << sphColour << std::endl;

        float A = rayDirection.dot(rayDirection);
        float B = 2.0 * (rayDirection.dot(rayOrigin) - rayDirection.dot(sphCentre));
        float C = rayOrigin.dot(rayOrigin) - 2.0 * rayOrigin.dot(sphCentre) + sphCentre.dot(sphCentre) - sphRadius * sphRadius;
        float D = B * B - 4.0 * A * C;

        // std::cout << "A: " << A << std::endl;
        // std::cout << "B: " << B << std::endl;
        // std::cout << "C: " << C << std::endl;
        // std::cout << "D: " << D << std::endl;

        Local<Object> returnObj = Object::New(isolate);


        if (D > 0.0) {
            float sqrtD = sqrt(D);
            if (-B - sqrtD > 0) {
                float t = (-B - sqrtD) / (2.0 * A);
                Vector pi = rayOrigin.add(rayDirection.scale(t));
                // std::cout << "t: " << t << std::endl;
                // std::cout << "pi: " << pi << std::endl;

                returnObj->Set(String::NewFromUtf8(isolate, "t"), Number::New(isolate, t));
                returnObj->Set(String::NewFromUtf8(isolate, "pi"), create_obj(isolate, pi));
                returnObj->Set(String::NewFromUtf8(isolate, "col"), args[4]);
                args.GetReturnValue().Set(returnObj);
                //
                return;
            }
        }

        // Return 'null'

        // returnObj->Set(String::NewFromUtf8(isolate, "msg"), args[0]->ToString());
        // Local<Null> x
        args.GetReturnValue().Set(Null(isolate));
}

void Init(Local<Object> exports) {
        NODE_SET_METHOD(exports, "intersect", Intersect);
}

NODE_MODULE(addon, Init)

}  // namespace demo
