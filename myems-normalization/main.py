import logging
from logging.handlers import RotatingFileHandler
from multiprocessing import Process
import datarepair
import meter
import offlinemeter
import virtualmeter
import virtualpoint


def main():
    """main"""
    # create logger
    logger = logging.getLogger('myems-normalization')
    # specifies the lowest-severity log message a logger will handle,
    # where debug is the lowest built-in severity level and critical is the highest built-in severity.
    # For example, if the severity level is INFO, the logger will handle only INFO, WARNING, ERROR, and CRITICAL
    # messages and will ignore DEBUG messages.
    logger.setLevel(logging.ERROR)
    # create file handler which logs messages
    fh = RotatingFileHandler('myems-normalization.log', maxBytes=1024*1024, backupCount=1)
    # create formatter and add it to the handlers
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    fh.setFormatter(formatter)
    # add the handlers to logger
    logger.addHandler(fh)
    # send logging output to sys.stderr
    logger.addHandler(logging.StreamHandler())

    # calculate energy consumption in hourly period
    Process(target=meter.calculate_hourly, args=(logger,)).start()
    Process(target=offlinemeter.calculate_hourly, args=(logger,)).start()
    Process(target=virtualmeter.calculate_hourly, args=(logger,)).start()
    # calculate virtual point value
    Process(target=virtualpoint.calculate, args=(logger,)).start()
    # repair historical energy value
    Process(target=datarepair.do, args=(logger,)).start()


if __name__ == '__main__':
    main()


