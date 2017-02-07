
#include <node.h>
#include <v8.h>

using namespace std;


class Vector {
public:
    float x;
    float y;
    float z;

    Vector(float, float, float);
    float dot(Vector);
    Vector add(Vector);
    Vector scale(float);
};

Vector::Vector(float _x, float _y, float _z) {
    x = _x;
    y = _y;
    z = _z;
}
float Vector::dot(Vector v) {
    return x * v.x + y * v.y + z * v.z;
}
Vector Vector::add(Vector v) {
    return Vector(x + v.x, y + v.y, z + v.z);
}
Vector Vector::scale(float f) {
    return Vector(x * f, y * f, z * f);
}

std::ostream& operator<<(std::ostream &strm, const Vector &v) {
  return strm << "Vector(" << v.x << ", " << v.y << ", " << v.z << ")";
}
