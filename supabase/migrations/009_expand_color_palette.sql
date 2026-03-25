-- Expand member color palette from 10 to 15 colors
create or replace function get_member_color(member_index int)
returns text
language sql
immutable
as $$
  select (array[
    '#1976D2', '#D32F2F', '#388E3C', '#7B1FA2', '#F57C00',
    '#00838F', '#C2185B', '#455A64', '#AFB42B', '#5D4037',
    '#0288D1', '#E64A19', '#303F9F', '#689F38', '#8E24AA'
  ])[1 + (member_index % 15)];
$$;
