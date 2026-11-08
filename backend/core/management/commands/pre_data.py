import csv
from django.core.management.base import BaseCommand
from master.models import Country
from master.models import State
from master.models import City

from django.db import transaction
from os import path
from backend import settings
from user.models import UserModel

class Command(BaseCommand):
    help = "Import countries and states from CSV files"

    def add_arguments(self, parser):
        parser.add_argument(
            "--countries",
            type=str,
            help="Path to countries CSV file",
        )
        parser.add_argument(
            "--states",
            type=str,
            help="Path to states CSV file",
        )
        
        parser.add_argument(
            "--cities",
            type=str,
            help="Path to cities CSV file",
        )

    @transaction.atomic
    def handle(self, *args, **kwargs):
        countries_file = path.join(
            settings.BASE_DIR, "core", "management", "source", "country.csv"
        )
        states_file = path.join(
            settings.BASE_DIR, "core", "management", "source", "state.csv"
        )
        
        cities_file = path.join(
            settings.BASE_DIR, "core", "management", "source", "city.csv"
        )

        self.stdout.write(self.style.NOTICE("Starting import of countries..."))
        countries_created = self.import_countries(countries_file)
        self.stdout.write(
            self.style.SUCCESS(f"Imported {countries_created} countries.")
        )

        self.stdout.write(self.style.NOTICE("Starting import of states..."))
        states_created = self.import_states(states_file)
        self.stdout.write(self.style.SUCCESS(f"Imported {states_created} states."))
        
        self.stdout.write(self.style.NOTICE("Starting import of cities..."))
        states_created = self.import_cities(cities_file)
        self.stdout.write(self.style.SUCCESS(f"Imported {states_created} cities."))
        
        self.stdout.write(self.style.NOTICE("Creating default admin user..."))

        admin_user, created = UserModel.objects.get_or_create(
            email="admin@example.com",
            defaults={
                "username": "admin",
                "phone_number": "",
                "is_active": True,
                "is_staff": True,
                "is_superuser": True,
                "is_email_verified": True,
            },
        )

        if created:
            admin_user.set_password("admin123")
            admin_user.save()

        admin_user.is_active = True
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.is_email_verified = True
        admin_user.save()


        self.stdout.write(
            self.style.SUCCESS(
                f"Default admin user {'created' if created else 'already exists'}."
            )
        )

        self.stdout.write(self.style.SUCCESS("Initial setup completed successfully."))

    def import_countries(self, countries_file):
        created_count = 0
        with open(countries_file, newline="", encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                country, created = Country.objects.get_or_create(
                    name=row["name"].strip()
                )
                if created:
                    created_count += 1
        return created_count

    def import_states(self, states_file):
        created_count = 0
        with open(states_file, newline="", encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                try:
                    country = Country.objects.get(id=row["country_id"])
                    state, created = State.objects.get_or_create(
                        name=row["name"].strip(),
                        country=country,
                    )
                    if created:
                        created_count += 1
                except Country.DoesNotExist:
                    self.stdout.write(
                        self.style.ERROR(
                            f"Country with code {row['country_id']} not found. Skipping state {row['name']}"
                        )
                    )
        return created_count


    def import_cities(self, cities_file):
        created_count = 0

        with open(cities_file, newline="", encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)

            for row in reader:
                try:
                    state = State.objects.get(
                        id=row["state_id"]
                    )

                    city, created = City.objects.get_or_create(
                        state=state,
                        name=row["name"].strip(),
                    )

                    if created:
                        created_count += 1

                except State.DoesNotExist:
                    self.stdout.write(
                        self.style.ERROR(
                            f"State with id {row['state_id']} not found. "
                            f"Skipping city {row['name']}"
                        )
                    )

        return created_count