import sys
import requests
import pyperclip
from base64 import b64encode
import pandas as pd
from datetime import datetime, timedelta
import os
import codecs
import matplotlib.pyplot as plt
import matplotlib as mpl


# 输入日记日期，得到记录的起床和结束时间
def get_up_end_time(diary_date: str):
    # 指定文件夹路径和文件名
    folder_path = 'YourDairyPath'
    file_name = f'{diary_date}.md'
    file_path = os.path.join(folder_path, file_name)

    get_up_time = ''
    end_up_time = ''
    # 检查文件是否存在
    if os.path.exists(file_path):
        # 以utf-8编码打开文件
        with codecs.open(file_path, 'r', encoding='utf-8') as file:
            # 读取文件内容
            lines = file.readlines()

            # 遍历每一行，找到包含 'get up' 文本的行
            for i in range(1, len(lines)):
                if '起床' in lines[i]:
                    # 获取上一行的内容
                    get_up_time = lines[i - 1].strip().replace('*', '')
                    # print("起床时间:", get_up_time)
                    continue
                elif '结束' in lines[i]:
                    # 获取上一行的内容
                    end_up_time = lines[i - 1].strip().replace('*', '')
                    # print("结束时间:", end_up_time)
                    break
            if get_up_time == '':
                get_up_time = '03:00'
                print('get up time is null,设置其为03:00')
            if end_up_time == '':
                end_up_time = datetime.today().strftime('%H:%M')
                print('end up is null, 默认设置为当前时间')

    else:
        print("文件不存在")
    return get_up_time, end_up_time


# 获取用于api对接的开始时间
def get_api_start_end_time(set_date: str):
    # 将输入的日期字符串转换为 datetime 格式
    single_start = datetime.strptime(set_date, "%Y-%m-%d")

    # 设置开始日期的东八区 I：设置凌晨三点为一天的开始结束统计时间。因为太多人熬夜。所以 hours为5 而不是8
    single_start = single_start - timedelta(hours=5)

    # 结束日期
    single_end = single_start + timedelta(days=1)

    # 用于接口获取的开始日期
    single_start_api = single_start.strftime('%Y-%m-%dT%H:%M:%SZ')

    # 用于接口获取的结束日期
    single_end_api = single_end.strftime('%Y-%m-%dT%H:%M:%SZ')
    return single_start_api, single_end_api


# 输入开始结束日期，获取日期范围内的toggl api各项数据,最后以一个关联的df形式返回
def get_data_df(single_start_api, single_end_api):
    # 获取time entries基础数据
    data = requests.get('https://api.track.toggl.com/api/v9/me/time_entries',
                        headers={'content-type': 'application/json',
                                 'Authorization': 'Basic %s' % b64encode(
                                     b"youraccount:yourpassword").decode(
                                     "ascii")},
                        params={'start_date': f'{single_start_api}', 'end_date': f'{single_end_api}'})

    # 获取项目跟project_id对应基础数据
    data_project = requests.get('https://api.track.toggl.com/api/v9/workspaces/xxxx/projects',
                                headers={'content-type': 'application/json',
                                         'Authorization': 'Basic %s' % b64encode(
                                             b"youraccount:yourpassword").decode("ascii")})
    # 获取client数据
    data_client = requests.get('https://api.track.toggl.com/api/v9/workspaces/xxxx/clients',
                               headers={'content-type': 'application/json', 'Authorization': 'Basic %s' % b64encode(
                                   b"youraccount:yourpassword").decode("ascii")})
    # 将time entries转换成df
    df_timeEntries_detail = pd.DataFrame(data.json())

    # 将项目对应数据转换成df
    df_project_detail = pd.DataFrame(data_project.json())

    # 将client数据转换成df
    df_client_detail = pd.DataFrame(data_client.json())

    # project id 重命名
    df_project_detail = df_project_detail.rename(columns={'id': 'project_id', 'name': 'project_name'})
    # client id 重命名
    df_client_detail = df_client_detail.rename(columns={'id': 'client_id', 'name': 'client_name'})

    # 左链接 将 project 与 client 链接
    df_project_detail = df_project_detail.merge(df_client_detail, on='client_id', how='left')

    # 通过左连接，将project name进行赋值
    df_link_detail = df_timeEntries_detail.merge(df_project_detail, on='project_id', how='left')

    # 将正在进行的项目排除
    df_count = df_link_detail[df_link_detail['duration'] > 0]

    # 使用apply()函数和axis=1参数
    def first_element(x):
        return x[0]

    # 取出tags中每一个tag的第一个
    df_count['tags'] = df_count['tags'].apply(first_element)

    return df_count


def seconds_to_hms(seconds):
    """
    将秒数转换为时分秒格式
    """
    # 计算小时、分钟和秒数
    m, s = divmod(seconds, 60)
    h, m = divmod(m, 60)
    return "{:d}:{:02d}:{:02d}".format(int(h), int(m), int(s))


def time_difference_in_seconds(start_time, end_time):
    """
    计算两个时间字符串的差值，并返回差值的秒数
    """
    # 定义时间格式
    time_format_with_seconds = "%H:%M:%S"
    time_format_without_seconds = "%H:%M"

    # 尝试用带秒数和不带秒数的格式解析时间字符串
    try:
        time1 = datetime.strptime(start_time, time_format_with_seconds)
        time2 = datetime.strptime(end_time, time_format_with_seconds)
    except ValueError:
        time1 = datetime.strptime(start_time, time_format_without_seconds)
        time2 = datetime.strptime(end_time, time_format_without_seconds)

    # 如果 time2 小于 time1，说明 time2 表示第二天的时间
    if time2 < time1:
        time2 += timedelta(days=1)

    # 计算时间差
    time_diff = time2 - time1

    # 将时间差转换为秒数
    seconds_diff = time_diff.total_seconds()

    return seconds_diff


def summary_detail(df_count, column_name, get_up_time, end_up_time, set_date):
    """
    :param df_count: 需要统计的df
    :param column_name:需要进行分组统计的列名
    :param get_up_time:起床时间
    :param end_up_time:结束时间
    :param set_date:传入时间，为了统计
    :return:统计结果的df,全天有效时间的df
    """
    # groupby统计
    df_tag_count = df_count.groupby(column_name).agg({'duration': 'sum'}).reset_index()
    # 求出占比
    df_tag_count['占比'] = df_tag_count['duration'].apply(
        lambda x: x / df_tag_count['duration'].sum() * 100)
    # 对占比进行排序
    df_tag_count = df_tag_count.sort_values(by='占比', ascending=False)
    # 对占比数值进行百分比格式化
    df_tag_count['占比'] = df_tag_count['占比'].apply(lambda x: '{:.2f}%'.format(x))
    # 统计全天有效时间的描述
    use_duration = time_difference_in_seconds(get_up_time, end_up_time)
    # 统计duration(全天利用时间)占全天有效时间的占比
    use_rate_number = df_tag_count['duration'].sum() / use_duration
    use_rate = '{:.2f}%'.format(use_rate_number * 100)
    # 构建一行数据
    # total_row = pd.Series({'duration': df_tag_count['duration'].sum(), '占比': use_rate}, name='总计')
    # 将一行数据附加到 DataFrame 中
    # df_tag_count = pd.concat([df_tag_count, total_row.to_frame().T])
    # 对duration进行标准时分秒展示
    df_tag_count['标准时间格式'] = df_tag_count['duration'].apply(lambda x: seconds_to_hms(x))
    # 新增一列日期，为传入的日期
    df_tag_count['日期'] = set_date
    # 新建一个空的df用来存放全天的统计数据
    df_total = pd.DataFrame()
    # 为 DataFrame 定义列名
    df_total = pd.DataFrame(columns=['全天有效时间', '全天利用时间', '占比', '占比数值', '日期'])
    df_total.loc[0] = [use_duration, df_tag_count['duration'].sum(), use_rate, use_rate_number, set_date]
    return df_tag_count, df_total


def generate_previous_dates(base_date_str: str, days: int):
    """
    生成对应日期前N天的日期数组
    :param base_date_str:'2024-01-01'
    :param days:int
    :return:
    """

    # 将基准日期字符串转换为 datetime 对象
    base_date = datetime.strptime(base_date_str, '%Y-%m-%d')

    # 生成前 days 天的日期数组，包含今天
    previous_dates = [(base_date - timedelta(days=i)).strftime('%Y-%m-%d') for i in range(days - 1, -1, -1)]

    return previous_dates


def get_set_date_data_df(set_get_date, column_name):
    """
    根据输入的date 获取聚合统计之后的数据df
    :param set_get_date: 设置获取对应日期的df数据
    :param column_name: 设置需要统计的事项列名，为一个数组
    :return:
    """
    # 获取当天的起床、结束时间
    up_time, end_time = get_up_end_time(set_get_date)

    # 获取当天用于api对接的开始结束时间
    api_start_time, api_end_time = get_api_start_end_time(set_get_date)

    # 获取当天的数据以df展示
    df = get_data_df(api_start_time, api_end_time)

    return summary_detail(df, column_name, up_time, end_time, set_get_date)


def plot_contrast_time_use_rate(df_statistic):
    '''
    画图函数
    :param df_statistic: 传入每日利用时间统计df
    :return: 画图
    '''
    df = df_statistic.copy()
    df.set_index('日期', inplace=True)

    # 设置全局字体大小为14
    mpl.rcParams.update({'font.size': 12})

    # 创建一个新的图形对象，并设置尺寸
    plt.figure(figsize=(20, 8))  # 宽度为 10，高度为 6

    # 将索引和数据转换为 NumPy 数组
    index_array = df.index.to_numpy()
    A_array = df['占比数值'].to_numpy()
    B_array = df['全天利用时间'].to_numpy()

    # 创建第一个坐标轴（左侧）
    ax1 = plt.gca()  # 获取当前 Axes 对象
    line = ax1.plot(index_array, A_array, color='green', marker='o', label='时间利用率')
    ax1.set_ylabel('时间利用率')  # 设置左侧 y 轴标签

    # 在折线图上显示数据值（保留两位小数）
    for i, txt in enumerate(A_array):
        ax1.text(index_array[i], txt + 0.01, f'{txt:.2f}', ha='center', va='bottom')

    # 创建第二个坐标轴（右侧）
    ax2 = ax1.twinx()  # 共享 x 轴，创建新的 y 轴
    bar = ax2.bar(index_array, B_array, color='red', alpha=0.5, label='全天利用时间')
    ax2.set_ylabel('全天利用时间')  # 设置右侧 y 轴标签

    # 在柱状图上显示数据值（将秒数转换为时分秒格式）
    for rect in bar:
        height = rect.get_height()
        seconds = int(height)
        time_str = seconds_to_hms(seconds)
        ax2.text(rect.get_x() + rect.get_width() / 2., height + 5, time_str, ha='center', va='bottom')

    # 添加图例
    lines, labels = ax1.get_legend_handles_labels()
    bars, _ = ax2.get_legend_handles_labels()
    ax2.legend(lines + bars, labels + ['全天利用时间'])

    # 添加标题和 x 轴标签
    plt.title('近期时间利用情况')
    plt.xlabel('Month')

    # 显示图形
    plt.show()


def get_column_value(df, column_name, row_number):
    '''
    根据输入的列名，返回第i+1行对应的值
    :param column_name:
    :return:
    '''
    return df.at[df.index[row_number], column_name]
