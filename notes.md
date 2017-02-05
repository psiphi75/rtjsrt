
# 01
Changed vector from [] to new Float32Array (x10 slower!!!)

# 02
Changed vector from [] to new Array (x4 slower!!!)

# 03 - Optimising vector.dot()
14 occurences reduced to 12

# 04 - Upgrade from Node 4.2 to 6.9

# 05 - Use SIMD instructions

It's going be slow for some time, read: https://groups.google.com/a/chromium.org/forum/#!topic/chromium-discuss/VEbF2KEmV-I

# 06 - Change vector to not create a new vector
