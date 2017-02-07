{
  "targets": [
    {
      "target_name": "sphere_intersect",
      "sources": [ "src/c/sphere_intersect.cc" ],
      'cflags': [ '-g', '-O3', '-ffast-math', '-mfpmath=sse', '-Ofast', '-flto', '-march=native'],
      'cflags_cc': [ '-g', '-O3', '-ffast-math', '-mfpmath=sse', '-Ofast', '-flto', '-march=native'],
    #   'cflags_cc!': [ '-fno-rtti' ]
    }
  ]
}
