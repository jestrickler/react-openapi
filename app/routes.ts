import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("pets", "routes/pets.tsx"),
	route("pets/new", "routes/pet-new.tsx"),
	route("pets/:petId/edit", "routes/pet-edit.tsx"),
] satisfies RouteConfig;
