-- Vibrant, maximally distinct color palette (15 colors)
create or replace function get_member_color(member_index int)
returns text
language sql
immutable
as $$
  select (array[
    '#2196F3', '#FF5252', '#4CAF50', '#FF9800', '#AB47BC',
    '#EC407A', '#26C6DA', '#FFCA28', '#5D4037', '#3F51B5',
    '#26A69A', '#FF7043', '#78909C', '#8BC34A', '#F06292'
  ])[1 + (member_index % 15)];
$$;
