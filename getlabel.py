#!/usr/bin/env python3

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title GetLbael
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 🤖
# @raycast.argument1 { "type": "dropdown", "placeholder": "Urgency", "data": [{"title": "立刻", "value": "3"},{"title": "接下来", "value": "2"},{"title": "随时", "value": "1"}] }
# @raycast.argument2 { "type": "dropdown", "placeholder": "Value", "data": [{"title": "重大改变", "value": "3"},{"title": "一般影响", "value": "2"},{"title": "轻微变化", "value": "1"}] }
# @raycast.argument3 { "type": "dropdown", "placeholder": "Duration", "data": [{"title": "一天内", "value": "1"},{"title": "月度", "value": "2"},{"title": "年度", "value": "3"}] }

# Documentation:
# @raycast.description base a basic information get a label

import sys

urgency = sys.argv[1]
value = sys.argv[2]
duration = sys.argv[3]
combine = urgency + value + duration

high_list = ['331', '332', '333', '321', '322', '311', '231', '232', '221', '131']
medium_list = ['323', '312', '233', '222', '211', '132', '121']
low_list = ['133', '122', '123', '111', '112', '113', '223', '212', '213', '313']

if combine in high_list:
    print('high')
elif combine in medium_list:
    print('medium')
else:
    print('low')
