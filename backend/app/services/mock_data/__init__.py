# Mock data providers for TMS, SMMS, TDMS, COA simulation
from .tms_provider import TMSProvider, get_tms_defects
from .smms_provider import SMMSProvider, get_smms_defects
from .tdms_provider import TDMSProvider, get_tdms_defects
from .coa_provider import COAProvider, get_train_timetable, get_freight_forecast, get_corridor_availability
from .resource_provider import ResourceProvider, get_available_resources
