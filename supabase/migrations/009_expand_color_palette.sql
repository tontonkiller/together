-- Vibrant summer color palette (15 colors)
create or replace function get_member_color(member_index int)
returns text
language sql
immutable
as $$
  select (array[
    '#2196F3', '#FF5252', '#4CAF50', '#AB47BC', '#FF9800',
    '#26C6DA', '#EC407A', '#42A5F5', '#FFCA28', '#66BB6A',
    '#FF7043', '#7E57C2', '#26A69A', '#FFA726', '#EF5350'
  ])[1 + (member_index % 15)];
$$;
