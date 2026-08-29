import { supabase } from "../lib/supabase";
import { DESIGN_SCHEMA_VERSION } from "../utils/designPersistence";

async function requireUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Necesitas una sesión válida para gestionar diseños.");
  return data.user;
}

function unwrap(result) {
  if (result.error) throw result.error;
  return result.data;
}

export async function listDesigns() {
  await requireUser();
  return unwrap(await supabase.from("furniture_designs")
    .select("id, name, furniture_type, schema_version, created_at, updated_at")
    .order("updated_at", { ascending: false }));
}

export async function getDesign(id) {
  await requireUser();
  return unwrap(await supabase.from("furniture_designs").select("*").eq("id", id).single());
}

export async function createDesign({ name, furnitureType, config }) {
  const user = await requireUser();
  return unwrap(await supabase.from("furniture_designs").insert({
    user_id: user.id,
    name: name.trim(),
    furniture_type: furnitureType,
    config,
    schema_version: DESIGN_SCHEMA_VERSION,
  }).select().single());
}

export async function updateDesign(id, { name, furnitureType, config }) {
  await requireUser();
  return unwrap(await supabase.from("furniture_designs").update({
    name: name.trim(),
    furniture_type: furnitureType,
    config,
    schema_version: DESIGN_SCHEMA_VERSION,
  }).eq("id", id).select().single());
}

export async function renameDesign(id, name) {
  await requireUser();
  return unwrap(await supabase.from("furniture_designs").update({ name: name.trim() }).eq("id", id).select().single());
}

export async function deleteDesign(id) {
  await requireUser();
  await unwrap(await supabase.from("furniture_designs").delete().eq("id", id));
}
