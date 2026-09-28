import asyncio
from app.core.database import init_db
from app.services.salary_service import generate_monthly_salaries

async def test():
    await init_db()
    from app.services.salary_service import get_all_salaries
    try:
        res = await get_all_salaries()
        print("Total salaries found:", len(res))
        if len(res) > 0:
            print(res[0])
        print("SUCCESS fetch")
    except Exception as e:
        print("ERROR:", e)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
