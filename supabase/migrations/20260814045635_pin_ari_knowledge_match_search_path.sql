-- Pin search_path for ARI knowledge matching functions so object resolution cannot
-- be changed by the caller's session search path.

alter function public.match_ari_knowledge_nodes(vector,integer)
  set search_path = public, pg_temp;

alter function public.match_ari_knowledge_nodes(vector,text[],integer,double precision)
  set search_path = public, pg_temp;
