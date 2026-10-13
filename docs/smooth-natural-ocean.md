# Smooth natural ocean and softened land

Starfield 0.1.11 applies the approved smooth natural ocean color gradation and softened land shader to the Emerald renderer. It does not add procedural waves, grain, micro-normals, bump maps or specular highlights.

The NASA image bytes remain unchanged (SHA-256 `2e24c29ee600b2e32a7fbb68286d996a9e1ef262cbe391f3652ab941b6931a13`). Relative shallow/coastal/deep-water colors come from the NASA RGB texture, with the existing gamma and a 10% blue tint. Daylight applies a bounded luminance-dependent midtone lift and chromatic correction; land uses a softer gain and highlight shoulder. The approved night-ocean expression is `amapOcean * 0.24`.

Approved shader block SHA-256: `7f6c6a14386394a3c85be43c7a679d2cb41c4baf4c8ed8f7dcb7ea959a2870b3` (UTF-8 first `fragmentShader` template literal contents including whitespace).

The solar calculation, day factor, terminator, atmosphere, background, arcs, city labels, detail panels and other renderers are preserved. This is a shader treatment of inherited NASA imagery, not newly authored Earth photography. Existing NASA and upstream notices continue to apply.
