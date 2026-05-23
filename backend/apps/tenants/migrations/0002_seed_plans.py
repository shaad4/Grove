from django.db import migrations


def seed_plans(apps, schema_editor):
    Plan = apps.get_model("tenants", "Plan")
    Plan.objects.bulk_create([
        Plan(name="free", client_limit=3, request_limit=10, price_monthly=0.00),
        Plan(name="pro", client_limit=-1, request_limit=-1, price_monthly=1999.00),
    ])


def unseed_plans(apps, schema_editor):
    apps.get_model("tenants", "Plan").objects.filter(name__in=["free", "pro"]).delete()


class Migration(migrations.Migration):
    dependencies = [("tenants", "0001_initial")]

    operations = [migrations.RunPython(seed_plans, unseed_plans)]